# SOLID Interview Questions - Senior Backend Engineer

---

### Q1: Look at this code. What SOLID principle does it violate and how would you fix it?

```typescript
class ReportService {
  generateReport(type: string, data: any): string {
    if (type === 'pdf') {
      // 50 lines of PDF generation
    } else if (type === 'excel') {
      // 50 lines of Excel generation
    } else if (type === 'csv') {
      // 50 lines of CSV generation
    }
  }
}
```

**Violates:** Open/Closed Principle

Every new report format requires modifying this class.

**Fix:**

```typescript
interface ReportGenerator {
  generate(data: any): string;
}

class PDFReportGenerator implements ReportGenerator {
  generate(data: any): string {
    // PDF logic
  }
}

class ExcelReportGenerator implements ReportGenerator {
  generate(data: any): string {
    // Excel logic
  }
}

class ReportService {
  generate(generator: ReportGenerator, data: any): string {
    return generator.generate(data);
  }
}

// Adding new format does not touch existing code
class CSVReportGenerator implements ReportGenerator {
  generate(data: any): string {
    // CSV logic
  }
}
```

---

### Q2: Your team created this interface. A new developer says it is wrong. Is he right?

```typescript
interface DataStore {
  save(data: any): void;
  find(id: string): any;
  delete(id: string): void;
  beginTransaction(): void;
  commitTransaction(): void;
  rollbackTransaction(): void;
}

class RedisCache implements DataStore {
  save(data: any): void { /* works */ }
  find(id: string): any { /* works */ }
  delete(id: string): void { /* works */ }
  beginTransaction(): void { throw new Error("Redis doesn't support transactions"); }
  commitTransaction(): void { throw new Error("Redis doesn't support transactions"); }
  rollbackTransaction(): void { throw new Error("Redis doesn't support transactions"); }
}
```

**Yes, he is right.** This violates Interface Segregation Principle.

RedisCache is forced to implement transaction methods it cannot support.

**Fix:**

```typescript
interface DataStore {
  save(data: any): void;
  find(id: string): any;
  delete(id: string): void;
}

interface Transactional {
  beginTransaction(): void;
  commitTransaction(): void;
  rollbackTransaction(): void;
}

class RedisCache implements DataStore {
  save(data: any): void { /* works */ }
  find(id: string): any { /* works */ }
  delete(id: string): void { /* works */ }
}

class PostgresDB implements DataStore, Transactional {
  save(data: any): void { /* works */ }
  find(id: string): any { /* works */ }
  delete(id: string): void { /* works */ }
  beginTransaction(): void { /* works */ }
  commitTransaction(): void { /* works */ }
  rollbackTransaction(): void { /* works */ }
}
```

---

### Q3: This service is hard to test. Why? How do you fix it?

```typescript
class OrderService {
  private paymentGateway = new StripeGateway();
  private emailService = new SendGridEmailService();
  private inventory = new WarehouseInventory();

  async placeOrder(order: Order): Promise<Result> {
    const stock = await this.inventory.check(order.items);
    if (!stock.available) return Result.outOfStock();

    const payment = await this.paymentGateway.charge(order.total);
    if (!payment.success) return Result.paymentFailed();

    await this.emailService.send(order.customer.email, "Order confirmed");
    return Result.success();
  }
}
```

**Problem:** Violates Dependency Inversion Principle.

The class creates its own dependencies. To test it, you must:
- Hit real Stripe API
- Send real emails
- Connect to real warehouse system

**Fix:**

```typescript
interface PaymentGateway {
  charge(amount: number): Promise<PaymentResult>;
}

interface EmailService {
  send(to: string, message: string): Promise<void>;
}

interface InventoryService {
  check(items: Item[]): Promise<StockResult>;
}

class OrderService {
  constructor(
    private paymentGateway: PaymentGateway,
    private emailService: EmailService,
    private inventory: InventoryService
  ) {}

  async placeOrder(order: Order): Promise<Result> {
    // Same logic, but dependencies are injected
  }
}

// In tests:
const service = new OrderService(
  new FakePaymentGateway(),
  new FakeEmailService(),
  new FakeInventory()
);
```

---

### Q4: A junior developer wrote this. What would you tell him in code review?

```typescript
class Bird {
  fly(): void {
    console.log("Flying");
  }

  layEggs(): void {
    console.log("Laying eggs");
  }
}

class Duck extends Bird {
  fly(): void {
    console.log("Duck flying");
  }

  swim(): void {
    console.log("Duck swimming");
  }
}

class Ostrich extends Bird {
  fly(): void {
    throw new Error("Ostriches cannot fly");
  }
}
```

**Problem:** Violates Liskov Substitution Principle.

Any code that expects a `Bird` and calls `fly()` will crash with Ostrich.

**What to tell him:**

"If a subclass cannot fulfill the parent's contract, it should not extend that parent. Restructure the hierarchy:"

```typescript
class Bird {
  layEggs(): void {
    console.log("Laying eggs");
  }
}

class FlyingBird extends Bird {
  fly(): void {
    console.log("Flying");
  }
}

class Duck extends FlyingBird {
  swim(): void {
    console.log("Duck swimming");
  }
}

class Ostrich extends Bird {
  run(): void {
    console.log("Ostrich running fast");
  }
}
```

---

### Q5: This class has 20 methods. How do you decide if it violates SRP?

Ask these questions:

1. **Can you describe what the class does without using "and"?**
   - Bad: "It handles users AND sends emails AND generates reports"
   - Good: "It manages user data"

2. **Do all methods use most of the class properties?**
   - If some methods only use `emailConfig` and others only use `dbConnection`, they belong in different classes.

3. **Who would request changes to this class?**
   - If the answer is "DBA for database stuff, marketing for email templates, finance for reports" - it has multiple responsibilities.

4. **What would you name smaller classes if you split it?**
   - If you can easily name them (UserRepository, EmailSender, ReportGenerator), the original class is doing too much.

---

### Q6: How do you apply Open/Closed in a real API endpoint?

Scenario: You have an endpoint that applies discounts. New discount types are added frequently.

**Bad approach:**

```typescript
app.post('/apply-discount', (req, res) => {
  const { type, amount } = req.body;

  let discount = 0;
  if (type === 'percentage') {
    discount = amount * 0.1;
  } else if (type === 'fixed') {
    discount = 10;
  } else if (type === 'loyalty') {
    discount = amount * getLoyaltyMultiplier(req.user);
  }
  // Adding new discount = modify this endpoint

  res.json({ discount });
});
```

**Good approach:**

```typescript
// Register discount strategies
const discountStrategies: Map<string, DiscountStrategy> = new Map();
discountStrategies.set('percentage', new PercentageDiscount());
discountStrategies.set('fixed', new FixedDiscount());
discountStrategies.set('loyalty', new LoyaltyDiscount());

app.post('/apply-discount', (req, res) => {
  const { type, amount } = req.body;

  const strategy = discountStrategies.get(type);
  if (!strategy) {
    return res.status(400).json({ error: 'Unknown discount type' });
  }

  const discount = strategy.calculate(amount, req.user);
  res.json({ discount });
});

// Adding new discount = add new class, register it. Endpoint unchanged.
discountStrategies.set('seasonal', new SeasonalDiscount());
```

---

### Q7: When is it okay to violate SOLID principles?

**SRP Violation - Acceptable:**
- Small scripts or utilities that will never grow
- DTOs (Data Transfer Objects) that just hold data

**OCP Violation - Acceptable:**
- When you are 100% sure no new variants will be added
- Simple switch statements with 2-3 cases that are stable

**LSP Violation - Never acceptable:**
- This always indicates wrong abstraction

**ISP Violation - Acceptable:**
- When the interface is from a library you cannot change
- Adapter pattern can help here

**DIP Violation - Acceptable:**
- Leaf classes that have no reason to change (e.g., `new Date()`)
- Framework code that handles DI for you

**General rule:** Violate SOLID only when the cost of following it exceeds the benefit, and document why.

---

### Q8: How does Dependency Inversion help with testing?

Without DIP:

```typescript
class UserService {
  private db = new PostgresDB();

  async getUser(id: string): Promise<User> {
    return this.db.query(`SELECT * FROM users WHERE id = $1`, [id]);
  }
}

// Test - must have real database running
test('getUser returns user', async () => {
  // Need to set up Postgres, seed data, clean up after
  const service = new UserService();
  const user = await service.getUser('123');
  expect(user.name).toBe('John');
});
```

With DIP:

```typescript
interface Database {
  query(sql: string, params: any[]): Promise<any>;
}

class UserService {
  constructor(private db: Database) {}

  async getUser(id: string): Promise<User> {
    return this.db.query(`SELECT * FROM users WHERE id = $1`, [id]);
  }
}

// Test - no real database needed
test('getUser returns user', async () => {
  const fakeDB: Database = {
    query: async () => ({ id: '123', name: 'John' })
  };

  const service = new UserService(fakeDB);
  const user = await service.getUser('123');
  expect(user.name).toBe('John');
});
```

Benefits:
- Tests run in milliseconds, not seconds
- No database setup/teardown
- Can test edge cases easily (fake returns error, empty result, etc.)
- Tests are isolated and reliable

---

### Q9: Refactor this to follow SOLID principles.

```typescript
class FileProcessor {
  process(filePath: string, outputType: string): void {
    // Read file
    const content = fs.readFileSync(filePath, 'utf-8');

    // Parse based on extension
    let data;
    if (filePath.endsWith('.json')) {
      data = JSON.parse(content);
    } else if (filePath.endsWith('.xml')) {
      data = parseXML(content);
    } else if (filePath.endsWith('.csv')) {
      data = parseCSV(content);
    }

    // Transform data
    const transformed = this.transform(data);

    // Output based on type
    if (outputType === 'console') {
      console.log(transformed);
    } else if (outputType === 'file') {
      fs.writeFileSync('output.txt', transformed);
    } else if (outputType === 'api') {
      axios.post('http://api.example.com', transformed);
    }
  }

  private transform(data: any): string {
    // transformation logic
    return JSON.stringify(data);
  }
}
```

**Refactored:**

```typescript
// SRP: Separate responsibilities
// OCP: New parsers/outputs don't modify existing code
// DIP: Depend on abstractions

interface FileParser {
  canParse(filePath: string): boolean;
  parse(content: string): any;
}

interface OutputHandler {
  handle(data: string): void;
}

class JSONParser implements FileParser {
  canParse(filePath: string): boolean {
    return filePath.endsWith('.json');
  }
  parse(content: string): any {
    return JSON.parse(content);
  }
}

class XMLParser implements FileParser {
  canParse(filePath: string): boolean {
    return filePath.endsWith('.xml');
  }
  parse(content: string): any {
    return parseXML(content);
  }
}

class ConsoleOutput implements OutputHandler {
  handle(data: string): void {
    console.log(data);
  }
}

class FileOutput implements OutputHandler {
  handle(data: string): void {
    fs.writeFileSync('output.txt', data);
  }
}

class FileProcessor {
  constructor(
    private parsers: FileParser[],
    private output: OutputHandler,
    private fileReader: FileReader = new RealFileReader()
  ) {}

  process(filePath: string): void {
    const content = this.fileReader.read(filePath);

    const parser = this.parsers.find(p => p.canParse(filePath));
    if (!parser) throw new Error('Unsupported file type');

    const data = parser.parse(content);
    const transformed = this.transform(data);
    this.output.handle(transformed);
  }

  private transform(data: any): string {
    return JSON.stringify(data);
  }
}

// Usage
const processor = new FileProcessor(
  [new JSONParser(), new XMLParser(), new CSVParser()],
  new ConsoleOutput()
);
```

---

### Q10: What is the relationship between SOLID and testability?

| Principle | How It Helps Testing |
|-----------|---------------------|
| **SRP** | Smaller classes = fewer test cases per class, easier to understand what to test |
| **OCP** | New features = new classes = new test files. Existing tests unchanged. |
| **LSP** | Tests written for parent work for all children. No special cases. |
| **ISP** | Mock only what you need. Small interfaces = simple mocks. |
| **DIP** | Inject fakes/mocks easily. No real databases/APIs in unit tests. |

If a class is hard to test, it probably violates one or more SOLID principles.

---

### Q11: How do you explain to a non-technical manager why refactoring to SOLID matters?

**Without SOLID:**
- Adding a new payment method takes 2 weeks because we touch 15 files
- Every release breaks something because code is tangled
- We cannot test properly, so bugs reach production
- New developers take months to understand the codebase

**With SOLID:**
- Adding a new payment method takes 2 days - we add one new file
- Changes are isolated, so other features do not break
- We can test each piece independently
- Code is organized by responsibility, easy to navigate

**Business impact:**
- Faster feature delivery
- Fewer bugs in production
- Lower onboarding cost for new hires
- Reduced technical debt

---

### Q12: Design a notification system that follows SOLID.

Requirements: Send notifications via Email, SMS, Push. Add new channels easily. Some users prefer certain channels.

```typescript
// ISP: Separate interfaces for different concerns
interface NotificationChannel {
  send(to: string, message: string): Promise<boolean>;
}

interface UserPreferenceStore {
  getPreferredChannels(userId: string): Promise<string[]>;
}

// OCP: New channels don't modify existing code
class EmailChannel implements NotificationChannel {
  constructor(private emailClient: EmailClient) {}

  async send(to: string, message: string): Promise<boolean> {
    return this.emailClient.send(to, message);
  }
}

class SMSChannel implements NotificationChannel {
  constructor(private smsClient: SMSClient) {}

  async send(to: string, message: string): Promise<boolean> {
    return this.smsClient.send(to, message);
  }
}

class PushChannel implements NotificationChannel {
  constructor(private pushClient: PushClient) {}

  async send(to: string, message: string): Promise<boolean> {
    return this.pushClient.send(to, message);
  }
}

// SRP: NotificationService only orchestrates
// DIP: Depends on abstractions, not concrete classes
class NotificationService {
  constructor(
    private channels: Map<string, NotificationChannel>,
    private preferences: UserPreferenceStore
  ) {}

  async notify(userId: string, contact: string, message: string): Promise<void> {
    const preferredChannels = await this.preferences.getPreferredChannels(userId);

    for (const channelName of preferredChannels) {
      const channel = this.channels.get(channelName);
      if (channel) {
        await channel.send(contact, message);
      }
    }
  }
}

// Composition root - wire everything together
const channels = new Map<string, NotificationChannel>();
channels.set('email', new EmailChannel(new SendGridClient()));
channels.set('sms', new SMSChannel(new TwilioClient()));
channels.set('push', new PushChannel(new FirebaseClient()));

const notificationService = new NotificationService(
  channels,
  new DatabasePreferenceStore()
);

// Adding WhatsApp channel - no modification to NotificationService
channels.set('whatsapp', new WhatsAppChannel(new WhatsAppClient()));
```

---

## Popular Questions

---

### Q13: What is the difference between Dependency Injection and Dependency Inversion?

**Dependency Inversion (DIP):** A principle - high-level modules should depend on abstractions, not concrete classes.

**Dependency Injection (DI):** A technique to achieve DIP - passing dependencies from outside instead of creating them inside.

```typescript
// DIP says: "Depend on Database interface, not MySQLDatabase"
// DI says: "Pass the database through constructor"

class UserService {
  constructor(private db: Database) {} // DI technique implementing DIP principle
}
```

DIP is the "what", DI is the "how".

---

### Q14: Can you have too many small classes? When does SRP go too far?

Yes. Signs you have gone too far:

1. **One method per class** - A class with only `save()` that calls another class is useless indirection

2. **Too many files to trace** - Simple operation requires opening 10 files

3. **Classes that are always used together** - If ClassA is never used without ClassB, maybe they should be one class

**Balance:** A class should have one responsibility, but that responsibility can include multiple related methods.

```typescript
// Too far - unnecessary split
class UserNameValidator { validate(name: string): boolean }
class UserEmailValidator { validate(email: string): boolean }
class UserAgeValidator { validate(age: number): boolean }

// Better - one responsibility: validate user data
class UserValidator {
  validateName(name: string): boolean { }
  validateEmail(email: string): boolean { }
  validateAge(age: number): boolean { }
}
```

---

### Q15: How do you refactor legacy code that violates SOLID without breaking it?

Step by step approach:

1. **Write tests for current behavior first** - Before changing anything

2. **Extract interface from existing class**
```typescript
// Before
class OldPaymentService {
  charge(amount: number) { /* 500 lines */ }
}

// Step 1: Extract interface
interface PaymentService {
  charge(amount: number): void;
}

class OldPaymentService implements PaymentService {
  charge(amount: number) { /* same 500 lines */ }
}
```

3. **Create new implementation** - Following SOLID

4. **Use feature flag to switch** - Route some traffic to new implementation

5. **Gradually migrate** - Once confident, remove old code

---

### Q16: Give a real example where Liskov Substitution was violated in production.

**Real scenario: Read-only replica database**

```typescript
class Database {
  read(query: string): any { }
  write(query: string): void { }
}

class ReadReplica extends Database {
  write(query: string): void {
    throw new Error("Read replica cannot write"); // LSP violation
  }
}

// Production code assumes all Database instances can write
function saveUser(db: Database, user: User) {
  db.write(`INSERT INTO users...`); // Crashes with ReadReplica
}
```

**Fix:**

```typescript
interface Readable {
  read(query: string): any;
}

interface Writable {
  write(query: string): void;
}

class MainDatabase implements Readable, Writable {
  read(query: string): any { }
  write(query: string): void { }
}

class ReadReplica implements Readable {
  read(query: string): any { }
  // No write method - honest about capabilities
}

function saveUser(db: Writable, user: User) {
  db.write(`INSERT INTO users...`); // ReadReplica cannot be passed here
}
```

---

### Q17: What is wrong with Singleton pattern from SOLID perspective?

Singleton often violates:

**DIP:** Classes depend on concrete Singleton, not abstraction
```typescript
class OrderService {
  process() {
    Logger.getInstance().log("processing"); // Direct dependency on concrete class
  }
}
```

**SRP:** Singleton manages its own lifecycle AND its business logic

**Testing:** Cannot inject mock, stuck with real instance

**Fix:** Use DI container to manage single instance instead

```typescript
// Bad - Singleton
class Logger {
  private static instance: Logger;
  static getInstance(): Logger { }
}

// Good - DI manages lifecycle
class Logger { }

// In DI container configuration
container.register(Logger, { lifecycle: 'singleton' });

// In class
class OrderService {
  constructor(private logger: Logger) {} // Injected, can be mocked
}
```

---

### Q18: You joined a new team. The codebase has 200-line controllers with business logic, database calls, and external API calls all mixed together. How do you approach this?

**Do not rewrite everything.** Incremental approach:

1. **Identify the most changed files** - These cause the most pain, fix first

2. **For each file, extract layers:**

```typescript
// Before: Fat controller
class OrderController {
  async createOrder(req, res) {
    // 50 lines validation
    // 30 lines business logic
    // 40 lines database calls
    // 30 lines external API calls
    // 50 lines response formatting
  }
}

// After: Layered
class OrderController {
  constructor(private orderService: OrderService) {}

  async createOrder(req, res) {
    const dto = OrderDTO.fromRequest(req);
    const result = await this.orderService.create(dto);
    res.json(OrderResponse.fromResult(result));
  }
}

class OrderService {
  constructor(
    private validator: OrderValidator,
    private repository: OrderRepository,
    private paymentGateway: PaymentGateway
  ) {}

  async create(dto: OrderDTO): Promise<Result> {
    // Business logic only
  }
}

class OrderRepository {
  // Database logic only
}
```

3. **Write tests as you refactor** - Ensures nothing breaks

4. **Document patterns for team** - So new code follows SOLID

---

### Q19: How do you balance SOLID with delivery speed?

**Early stage / MVP:**
- Skip OCP if you have only 2 cases and deadline is tomorrow
- Violate DIP for simple scripts that will not grow
- Document technical debt

**Growth stage:**
- Apply SOLID to core domain logic
- Keep infrastructure code flexible
- Refactor before adding third variant (OCP)

**Mature product:**
- Strict SOLID in critical paths
- Review for SOLID violations in PRs
- Technical debt sprints to fix violations

**Signs you skipped too much:**
- Adding simple feature touches 10 files
- Tests are flaky or slow
- New developers struggle to understand code
- Bugs in one area break unrelated features

---

## Microservices Questions

---

### Q20: How does SRP apply when splitting a monolith into microservices?

Each microservice should own one business domain:

```
Monolith (violates SRP at service level):
┌─────────────────────────────────────────┐
│ EcommerceApp                            │
│  - User management                      │
│  - Product catalog                      │
│  - Order processing                     │
│  - Payment handling                     │
│  - Inventory management                 │
│  - Notification sending                 │
└─────────────────────────────────────────┘

Microservices (SRP applied):
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ UserService  │  │ CatalogSvc   │  │ OrderService │
│ - register   │  │ - products   │  │ - create     │
│ - login      │  │ - categories │  │ - cancel     │
│ - profile    │  │ - search     │  │ - status     │
└──────────────┘  └──────────────┘  └──────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ PaymentSvc   │  │ InventorySvc │  │ NotifySvc    │
│ - charge     │  │ - stock      │  │ - email      │
│ - refund     │  │ - reserve    │  │ - sms        │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Benefit:** Team A changes UserService without affecting OrderService.

---

### Q21: How do you apply OCP when designing microservice APIs?

**Problem:** Changing API breaks all consumers.

**Solution:** Versioning and additive changes.

```typescript
// v1 - Original
POST /api/v1/orders
{
  "productId": "123",
  "quantity": 2
}

// v2 - Extended (OCP: added new field, did not remove old)
POST /api/v2/orders
{
  "productId": "123",
  "quantity": 2,
  "giftWrap": true,      // New optional field
  "deliveryDate": "..." // New optional field
}

// v1 still works - closed for modification
// v2 adds features - open for extension
```

**API Gateway pattern:**

```typescript
// Gateway routes based on version
class OrderGateway {
  constructor(
    private v1Handler: OrderHandlerV1,
    private v2Handler: OrderHandlerV2
  ) {}

  route(version: string, request: Request) {
    if (version === 'v1') return this.v1Handler.handle(request);
    if (version === 'v2') return this.v2Handler.handle(request);
  }
}

// Adding v3 does not modify existing handlers
```

---

### Q22: How does DIP apply to microservice communication?

**Without DIP:** Services directly call each other.

```typescript
// OrderService directly knows about InventoryService
class OrderService {
  async createOrder(order: Order) {
    const response = await axios.post('http://inventory-service:3000/reserve', order.items);
    // Tightly coupled to:
    // - Specific URL
    // - HTTP protocol
    // - InventoryService implementation
  }
}
```

**With DIP:** Depend on contracts, not implementations.

```typescript
// OrderService depends on abstraction
interface InventoryClient {
  reserve(items: Item[]): Promise<ReservationResult>;
}

class OrderService {
  constructor(private inventory: InventoryClient) {}

  async createOrder(order: Order) {
    const result = await this.inventory.reserve(order.items);
  }
}

// Implementation can be HTTP, gRPC, message queue, or mock
class HttpInventoryClient implements InventoryClient {
  async reserve(items: Item[]): Promise<ReservationResult> {
    return axios.post('http://inventory-service/reserve', items);
  }
}

class GrpcInventoryClient implements InventoryClient {
  async reserve(items: Item[]): Promise<ReservationResult> {
    return this.grpcClient.reserve(items);
  }
}

class MockInventoryClient implements InventoryClient {
  async reserve(items: Item[]): Promise<ReservationResult> {
    return { success: true }; // For testing
  }
}
```

**Benefits:**
- Switch from HTTP to gRPC without changing OrderService
- Test OrderService without running InventoryService
- Circuit breaker can be added at client level

---

### Q23: How does ISP apply to microservice contracts?

**Problem:** Fat API contract forces consumers to know about things they do not use.

```typescript
// Bad - one big contract
interface ProductService {
  getProduct(id: string): Product;
  updateProduct(id: string, data: Product): void;
  deleteProduct(id: string): void;
  getInventory(id: string): number;
  updateInventory(id: string, count: number): void;
  getProductReviews(id: string): Review[];
  addReview(id: string, review: Review): void;
}

// Catalog team only needs read operations
// Inventory team only needs inventory operations
// Review team only needs review operations
```

**Good - segregated contracts:**

```typescript
// Read-only contract for catalog consumers
interface ProductReader {
  getProduct(id: string): Product;
}

// Admin contract
interface ProductAdmin {
  updateProduct(id: string, data: Product): void;
  deleteProduct(id: string): void;
}

// Inventory contract
interface InventoryManager {
  getInventory(id: string): number;
  updateInventory(id: string, count: number): void;
}

// Review contract
interface ReviewManager {
  getProductReviews(id: string): Review[];
  addReview(id: string, review: Review): void;
}
```

---

### Q24: How do you design event-driven microservices following SOLID?

```typescript
// ISP: Separate event interfaces
interface OrderCreatedEvent {
  orderId: string;
  customerId: string;
  items: Item[];
  total: number;
}

interface PaymentCompletedEvent {
  orderId: string;
  transactionId: string;
}

// OCP: New handlers without modifying existing
interface EventHandler<T> {
  handle(event: T): Promise<void>;
}

class InventoryReserver implements EventHandler<OrderCreatedEvent> {
  async handle(event: OrderCreatedEvent): Promise<void> {
    await this.inventory.reserve(event.items);
  }
}

class NotificationSender implements EventHandler<OrderCreatedEvent> {
  async handle(event: OrderCreatedEvent): Promise<void> {
    await this.notifier.send(event.customerId, "Order received");
  }
}

// DIP: EventBus depends on abstractions
class EventBus {
  private handlers: Map<string, EventHandler<any>[]> = new Map();

  subscribe<T>(eventType: string, handler: EventHandler<T>): void {
    const existing = this.handlers.get(eventType) || [];
    this.handlers.set(eventType, [...existing, handler]);
  }

  async publish<T>(eventType: string, event: T): Promise<void> {
    const handlers = this.handlers.get(eventType) || [];
    await Promise.all(handlers.map(h => h.handle(event)));
  }
}

// Adding new handler does not modify existing code
eventBus.subscribe('order.created', new InventoryReserver(inventory));
eventBus.subscribe('order.created', new NotificationSender(notifier));
eventBus.subscribe('order.created', new AnalyticsTracker(analytics)); // New handler
```
