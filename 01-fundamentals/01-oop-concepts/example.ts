// ============================================
// OOP Concepts in TypeScript - Examples
// ============================================

// ============================================
// 1. CLASSES & OBJECTS
// ============================================

class Person {
  // Properties
  name: string;
  age: number;

  // Constructor - called when creating new object
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  // Method
  introduce(): string {
    return `Hi, I'm ${this.name} and I'm ${this.age} years old.`;
  }
}

// Creating objects (instances)
const person1 = new Person("Alice", 25);
const person2 = new Person("Bob", 30);

console.log(person1.introduce()); // Hi, I'm Alice and I'm 25 years old.
console.log(person2.introduce()); // Hi, I'm Bob and I'm 30 years old.

// ============================================
// 2. ENCAPSULATION
// ============================================

class BankAccount {
  private balance: number; // Private - cannot be accessed directly
  public accountHolder: string; // Public - can be accessed from anywhere

  constructor(accountHolder: string, initialBalance: number) {
    this.accountHolder = accountHolder;
    this.balance = initialBalance;
  }

  // Getter - controlled access to private data
  getBalance(): number {
    return this.balance;
  }

  // Methods to modify private data with validation
  deposit(amount: number): void {
    if (amount > 0) {
      this.balance += amount;
      console.log(`Deposited: $${amount}. New balance: $${this.balance}`);
    } else {
      console.log("Invalid deposit amount");
    }
  }

  withdraw(amount: number): void {
    if (amount > 0 && amount <= this.balance) {
      this.balance -= amount;
      console.log(`Withdrawn: $${amount}. New balance: $${this.balance}`);
    } else {
      console.log("Invalid withdrawal amount or insufficient funds");
    }
  }
}

const account = new BankAccount("John", 1000);
// account.balance = 999999; // ERROR! Cannot access private property
account.deposit(500); // Deposited: $500. New balance: $1500
account.withdraw(200); // Withdrawn: $200. New balance: $1300
console.log(`Balance: $${account.getBalance()}`); // Balance: $1300

// ============================================
// 3. ABSTRACTION
// ============================================

// Abstract class - cannot be instantiated directly
abstract class Vehicle {
  protected brand: string;

  constructor(brand: string) {
    this.brand = brand;
  }

  // Abstract method - must be implemented by child classes
  abstract start(): void;
  abstract stop(): void;

  // Concrete method - shared implementation
  getBrand(): string {
    return this.brand;
  }
}

class Car extends Vehicle {
  start(): void {
    console.log(`${this.brand} car engine started with key ignition`);
  }

  stop(): void {
    console.log(`${this.brand} car engine stopped`);
  }
}

class Motorcycle extends Vehicle {
  start(): void {
    console.log(`${this.brand} motorcycle started with kick start`);
  }

  stop(): void {
    console.log(`${this.brand} motorcycle stopped`);
  }
}

// const vehicle = new Vehicle("Generic"); // ERROR! Cannot instantiate abstract class
const car = new Car("Toyota");
const bike = new Motorcycle("Honda");

car.start(); // Toyota car engine started with key ignition
bike.start(); // Honda motorcycle started with kick start

// ============================================
// 4. INHERITANCE
// ============================================

// Parent/Base class
class Animal {
  protected name: string;

  constructor(name: string) {
    this.name = name;
  }

  eat(): void {
    console.log(`${this.name} is eating`);
  }

  sleep(): void {
    console.log(`${this.name} is sleeping`);
  }
}

// Child/Derived class
class Dog extends Animal {
  private breed: string;

  constructor(name: string, breed: string) {
    super(name); // Call parent constructor
    this.breed = breed;
  }

  // Additional method specific to Dog
  bark(): void {
    console.log(`${this.name} is barking! Woof!`);
  }

  // Getter for breed
  getBreed(): string {
    return this.breed;
  }
}

class Cat extends Animal {
  constructor(name: string) {
    super(name);
  }

  meow(): void {
    console.log(`${this.name} says Meow!`);
  }
}

const dog = new Dog("Buddy", "Golden Retriever");
dog.eat(); // Buddy is eating (inherited from Animal)
dog.sleep(); // Buddy is sleeping (inherited from Animal)
dog.bark(); // Buddy is barking! Woof! (Dog's own method)

const cat = new Cat("Whiskers");
cat.eat(); // Whiskers is eating
cat.meow(); // Whiskers says Meow!

// ============================================
// 5. POLYMORPHISM
// ============================================

// --- Runtime Polymorphism (Method Overriding) ---

class Shape {
  calculateArea(): number {
    return 0;
  }

  describe(): void {
    console.log("This is a shape");
  }
}

class Rectangle extends Shape {
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    super();
    this.width = width;
    this.height = height;
  }

  // Override parent method
  calculateArea(): number {
    return this.width * this.height;
  }

  describe(): void {
    console.log(`Rectangle: ${this.width} x ${this.height}`);
  }
}

class Circle extends Shape {
  private radius: number;

  constructor(radius: number) {
    super();
    this.radius = radius;
  }

  // Override parent method
  calculateArea(): number {
    return Math.PI * this.radius * this.radius;
  }

  describe(): void {
    console.log(`Circle with radius: ${this.radius}`);
  }
}

// Polymorphism in action - treating different objects as same type
const shapes: Shape[] = [new Rectangle(5, 10), new Circle(7), new Rectangle(3, 4)];

for (const shape of shapes) {
  shape.describe(); // Calls the appropriate describe() based on actual object type
  console.log(`Area: ${shape.calculateArea().toFixed(2)}`);
  console.log("---");
}

// ============================================
// 6. STATIC MEMBERS
// ============================================

class MathUtils {
  static PI: number = 3.14159;
  static instanceCount: number = 0;

  constructor() {
    MathUtils.instanceCount++;
  }

  // Static method - belongs to class, not instance
  static square(n: number): number {
    return n * n;
  }

  static cube(n: number): number {
    return n * n * n;
  }
}

// Access static members without creating instance
console.log(MathUtils.PI); // 3.14159
console.log(MathUtils.square(5)); // 25
console.log(MathUtils.cube(3)); // 27

new MathUtils();
new MathUtils();
console.log(`Instances created: ${MathUtils.instanceCount}`); // 2

// ============================================
// 7. INTERFACES (TypeScript specific)
// ============================================

// Interface defines a contract
interface Flyable {
  fly(): void;
  getAltitude(): number;
}

interface Swimmable {
  swim(): void;
  getDepth(): number;
}

// A class can implement multiple interfaces
class Duck implements Flyable, Swimmable {
  private altitude: number = 0;
  private depth: number = 0;

  fly(): void {
    this.altitude = 100;
    console.log("Duck is flying!");
  }

  getAltitude(): number {
    return this.altitude;
  }

  swim(): void {
    this.depth = 5;
    console.log("Duck is swimming!");
  }

  getDepth(): number {
    return this.depth;
  }
}

const duck = new Duck();
duck.fly(); // Duck is flying!
duck.swim(); // Duck is swimming!

// ============================================
// Run all examples
// ============================================

console.log("\n=== OOP Examples Complete ===\n");
