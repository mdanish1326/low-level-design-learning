# OOP Interview Questions - Senior Backend Engineer

---

### Q1: You have a class with 15 methods. How do you know it needs refactoring?

This violates Single Responsibility Principle. Signs to look for:
- Methods that do not use most of the class properties
- Groups of methods that only work with specific properties
- The class name is too generic (like `Helper`, `Manager`, `Processor`)

**Solution:** Split into smaller classes where each handles one responsibility.

```typescript
// Bad - doing too much
class UserManager {
  createUser() { }
  deleteUser() { }
  sendEmail() { }
  generateReport() { }
  validatePassword() { }
  uploadAvatar() { }
}

// Better - separated concerns
class UserService {
  createUser() { }
  deleteUser() { }
}

class EmailService {
  sendEmail() { }
}

class ReportService {
  generateReport() { }
}
```

---

### Q2: When would you choose composition over inheritance? Give a real example.

Use composition when:
- You need flexibility to change behavior at runtime
- The relationship is "HAS-A" not "IS-A"
- You want to avoid deep inheritance hierarchies
- You need to combine behaviors from multiple sources

**Real example - Payment Processing:**

```typescript
// Bad - inheritance locks you in
class CreditCardPayment extends Payment { }
class PayPalPayment extends Payment { }
class CreditCardPaymentWithFraudCheck extends CreditCardPayment { } // Getting messy

// Good - composition gives flexibility
class PaymentProcessor {
  constructor(
    private paymentMethod: PaymentMethod,
    private fraudChecker: FraudChecker,
    private logger: Logger
  ) {}

  process(amount: number): Result {
    if (!this.fraudChecker.check(amount)) {
      return Result.rejected();
    }
    return this.paymentMethod.charge(amount);
  }
}

// Can swap components easily
const processor = new PaymentProcessor(
  new StripePayment(),
  new MLFraudChecker(),
  new CloudLogger()
);
```

---

### Q3: How do you handle the situation where two classes need each other (circular dependency)?

Circular dependencies indicate poor design. Solutions:

1. **Extract common code to a third class**
2. **Use dependency injection with interfaces**
3. **Use events/observers to decouple**

```typescript
// Problem: Order needs Customer, Customer needs Order
class Order {
  constructor(private customer: Customer) { }
}
class Customer {
  constructor(private orders: Order[]) { }
}

// Solution 1: Interface segregation
interface OrderOwner {
  getId(): string;
  getEmail(): string;
}

class Order {
  constructor(private owner: OrderOwner) { } // Depends on interface, not Customer
}

// Solution 2: Event-based
class Order {
  constructor(private eventBus: EventBus) { }

  complete() {
    this.eventBus.emit('order.completed', { orderId: this.id });
  }
}

class Customer {
  constructor(eventBus: EventBus) {
    eventBus.on('order.completed', (data) => this.handleOrderComplete(data));
  }
}
```

---

### Q4: Your base class method works for most subclasses but not all. How do you handle this?

This is the Liskov Substitution Problem. Options:

1. **Rethink your hierarchy** - maybe they should not share a parent
2. **Use composition instead**
3. **Split the interface**

```typescript
// Problem: Not all birds fly
class Bird {
  fly() { console.log("Flying"); }
}
class Penguin extends Bird {
  fly() { throw new Error("Cannot fly"); } // Violates LSP
}

// Solution: Split the capability
interface Bird {
  eat(): void;
}

interface FlyingBird extends Bird {
  fly(): void;
}

class Sparrow implements FlyingBird {
  eat() { }
  fly() { }
}

class Penguin implements Bird {
  eat() { }
  // No fly method - honest design
}
```

---

### Q5: How would you design a class that should never be modified after creation?

Make it immutable:

```typescript
class Config {
  private readonly settings: Map<string, string>;

  constructor(settings: Record<string, string>) {
    // Deep copy on construction
    this.settings = new Map(Object.entries(settings));
    Object.freeze(this);
  }

  get(key: string): string | undefined {
    return this.settings.get(key);
  }

  // Return new instance instead of mutating
  with(key: string, value: string): Config {
    const newSettings = Object.fromEntries(this.settings);
    newSettings[key] = value;
    return new Config(newSettings);
  }
}

const config = new Config({ env: 'prod' });
const newConfig = config.with('debug', 'true'); // Original unchanged
```

**Why immutability matters in backend:**
- Thread safety - no race conditions
- Predictable behavior - easier debugging
- Cache friendly - can safely cache and share

---

### Q6: You need to add logging to 50 existing methods without modifying them. How?

Use the **Decorator Pattern** or **Proxy Pattern**:

```typescript
// Original service
class UserService {
  getUser(id: string): User {
    return this.db.find(id);
  }
}

// Decorator approach
class LoggingUserService implements IUserService {
  constructor(private wrapped: IUserService, private logger: Logger) {}

  getUser(id: string): User {
    this.logger.log(`getUser called with ${id}`);
    const result = this.wrapped.getUser(id);
    this.logger.log(`getUser returned ${result.name}`);
    return result;
  }
}

// Usage - no changes to original
const service = new LoggingUserService(
  new UserService(),
  new Logger()
);

// Alternative: Proxy (JavaScript)
function withLogging<T extends object>(target: T, logger: Logger): T {
  return new Proxy(target, {
    get(obj, prop) {
      const value = obj[prop as keyof T];
      if (typeof value === 'function') {
        return (...args: unknown[]) => {
          logger.log(`${String(prop)} called`);
          return value.apply(obj, args);
        };
      }
      return value;
    }
  });
}
```

---

### Q7: How do you handle optional dependencies in a class?

Several approaches:

```typescript
// 1. Null Object Pattern
interface Logger {
  log(msg: string): void;
}

class NullLogger implements Logger {
  log(msg: string): void { } // Does nothing
}

class Service {
  constructor(private logger: Logger = new NullLogger()) {}
}

// 2. Optional with default behavior
class Service {
  constructor(private logger?: Logger) {}

  doWork() {
    this.logger?.log('working'); // Only logs if logger exists
  }
}

// 3. Builder pattern for complex optional dependencies
class ServiceBuilder {
  private logger?: Logger;
  private cache?: Cache;
  private metrics?: Metrics;

  withLogger(logger: Logger): this {
    this.logger = logger;
    return this;
  }

  withCache(cache: Cache): this {
    this.cache = cache;
    return this;
  }

  build(): Service {
    return new Service(this.logger, this.cache, this.metrics);
  }
}
```

---

### Q8: How would you refactor a 500-line method?

Step by step:

1. **Write tests first** - before touching anything
2. **Identify logical blocks** - comments often hint at these
3. **Extract methods** - each block becomes a method
4. **Look for hidden classes** - if extracted methods form groups, they might be a separate class
5. **Remove duplication** - now patterns are visible

```typescript
// Before: 500 line monster
function processOrder(order: Order) {
  // 50 lines: validate order
  // 100 lines: calculate pricing
  // 80 lines: check inventory
  // 100 lines: process payment
  // 70 lines: send notifications
  // 100 lines: update analytics
}

// After: orchestrator with focused classes
class OrderProcessor {
  constructor(
    private validator: OrderValidator,
    private pricer: PricingService,
    private inventory: InventoryService,
    private payment: PaymentService,
    private notifier: NotificationService,
    private analytics: AnalyticsService
  ) {}

  process(order: Order): Result {
    const validation = this.validator.validate(order);
    if (!validation.ok) return Result.invalid(validation.errors);

    const price = this.pricer.calculate(order);

    if (!this.inventory.reserve(order.items)) {
      return Result.outOfStock();
    }

    const payment = this.payment.charge(order.customer, price);
    if (!payment.success) {
      this.inventory.release(order.items);
      return Result.paymentFailed();
    }

    this.notifier.orderConfirmed(order);
    this.analytics.track('order.completed', order);

    return Result.success(order);
  }
}
```

---

### Q9: When should a method be static vs instance method?

**Static when:**
- Method does not use any instance state
- It is a utility/helper function
- Factory methods

**Instance when:**
- Method uses or modifies instance state
- Behavior might be overridden in subclasses
- Method is part of the object's responsibility

```typescript
class User {
  constructor(private name: string, private email: string) {}

  // Instance - uses this.email
  sendWelcomeEmail(): void {
    EmailService.send(this.email, 'Welcome!');
  }

  // Should be static - does not use any instance data
  // Bad as instance method:
  formatDate(date: Date): string {
    return date.toISOString();
  }

  // Good as static:
  static formatDate(date: Date): string {
    return date.toISOString();
  }

  // Factory method - static makes sense
  static fromJSON(json: string): User {
    const data = JSON.parse(json);
    return new User(data.name, data.email);
  }
}
```

---

### Q10: How do you design for testability?

Key principles:

1. **Inject dependencies** - never instantiate inside
2. **Program to interfaces** - allows mocking
3. **Avoid static methods for business logic** - hard to mock
4. **Keep constructors simple** - no logic, just assignment

```typescript
// Hard to test
class OrderService {
  private db = new Database();          // Cannot mock
  private cache = RedisCache.instance;  // Singleton, cannot mock

  createOrder(data: OrderData): Order {
    // Complex logic mixed with dependencies
  }
}

// Easy to test
class OrderService {
  constructor(
    private db: IDatabase,      // Interface - can inject mock
    private cache: ICache,      // Interface - can inject mock
    private clock: IClock       // Even time is injectable
  ) {}

  createOrder(data: OrderData): Order {
    // Same logic, but dependencies are mockable
  }
}

// In tests:
const service = new OrderService(
  new MockDatabase(),
  new MockCache(),
  new FakeClock('2024-01-01')
);
```

---

### Q11: What is the difference between throwing exceptions vs returning error objects?

**Exceptions:**
- For unexpected errors (database down, network failure)
- Caller must handle or program crashes
- Breaks normal flow

**Error objects (Result pattern):**
- For expected failures (validation, business rules)
- Caller explicitly handles the result
- Normal flow continues

```typescript
// Exception - unexpected failure
class UserRepository {
  findById(id: string): User {
    const user = this.db.query(id);
    if (!user) {
      throw new UserNotFoundError(id); // Exceptional case
    }
    return user;
  }
}

// Result pattern - expected failure
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

class UserService {
  createUser(data: UserData): Result<User, ValidationError[]> {
    const errors = this.validate(data);
    if (errors.length > 0) {
      return { ok: false, error: errors }; // Expected failure
    }
    return { ok: true, value: new User(data) };
  }
}

// Usage
const result = userService.createUser(data);
if (!result.ok) {
  return res.status(400).json(result.error);
}
// Continue with result.value
```

---

### Q12: Design a rate limiter class.

```typescript
interface RateLimiter {
  tryAcquire(key: string): boolean;
}

// Token bucket implementation
class TokenBucketRateLimiter implements RateLimiter {
  private buckets: Map<string, { tokens: number; lastRefill: number }> = new Map();

  constructor(
    private maxTokens: number,
    private refillRate: number, // tokens per second
    private clock: Clock = new SystemClock()
  ) {}

  tryAcquire(key: string): boolean {
    const now = this.clock.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.maxTokens, lastRefill: now };
      this.buckets.set(key, bucket);
    }

    // Refill tokens based on time passed
    const timePassed = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(
      this.maxTokens,
      bucket.tokens + timePassed * this.refillRate
    );
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }
}

// Usage
const limiter = new TokenBucketRateLimiter(10, 1); // 10 max, 1 per second refill

if (!limiter.tryAcquire(userId)) {
  return res.status(429).json({ error: 'Too many requests' });
}
```

---

### Q13: How would you implement a plugin system using OOP?

```typescript
// Define the contract
interface Plugin {
  name: string;
  initialize(): Promise<void>;
  execute(context: Context): Promise<void>;
  shutdown(): Promise<void>;
}

// Plugin manager
class PluginManager {
  private plugins: Map<string, Plugin> = new Map();

  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} already registered`);
    }
    this.plugins.set(plugin.name, plugin);
  }

  async initializeAll(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      await plugin.initialize();
    }
  }

  async executeAll(context: Context): Promise<void> {
    for (const plugin of this.plugins.values()) {
      await plugin.execute(context);
    }
  }

  async shutdownAll(): Promise<void> {
    // Shutdown in reverse order
    const plugins = Array.from(this.plugins.values()).reverse();
    for (const plugin of plugins) {
      await plugin.shutdown();
    }
  }
}

// Example plugin
class LoggingPlugin implements Plugin {
  name = 'logging';

  async initialize(): Promise<void> {
    console.log('Logging plugin initialized');
  }

  async execute(context: Context): Promise<void> {
    console.log(`Request: ${context.method} ${context.path}`);
  }

  async shutdown(): Promise<void> {
    console.log('Logging plugin shutdown');
  }
}
```

---

### Q14: What is the problem with this code?

```typescript
class Animal {
  constructor(public type: string) {}

  makeSound(): string {
    if (this.type === 'dog') return 'bark';
    if (this.type === 'cat') return 'meow';
    if (this.type === 'cow') return 'moo';
    return 'unknown';
  }

  move(): string {
    if (this.type === 'dog') return 'run';
    if (this.type === 'fish') return 'swim';
    if (this.type === 'bird') return 'fly';
    return 'walk';
  }
}
```

**Problems:**
1. Violates Open/Closed - must modify class to add new animal
2. Violates Single Responsibility - one class handles all animal types
3. Type checking with strings is error-prone
4. Each new method requires adding more if-else

**Fix:**

```typescript
abstract class Animal {
  abstract makeSound(): string;
  abstract move(): string;
}

class Dog extends Animal {
  makeSound(): string { return 'bark'; }
  move(): string { return 'run'; }
}

class Cat extends Animal {
  makeSound(): string { return 'meow'; }
  move(): string { return 'walk'; }
}

// Adding new animal does not modify existing code
class Fish extends Animal {
  makeSound(): string { return 'blub'; }
  move(): string { return 'swim'; }
}
```
