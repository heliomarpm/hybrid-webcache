import FDBFactory from "fake-indexeddb/lib/FDBFactory";
import { beforeEach, describe, expect, it } from "vitest";
import { HybridWebCache, StorageEngine } from "../src";

const strategies = [
	{ name: "Automatic", type: StorageEngine.Auto },
	{ name: "LocalStorage", type: StorageEngine.LocalStorage },
	{ name: "SessionStorage", type: StorageEngine.SessionStorage },
	{ name: "IndexedDB", type: StorageEngine.IndexedDB },
	{ name: "Memory", type: StorageEngine.Memory },
];

describe.each(strategies)("HybridWebCache with $name Strategy", ({ type }) => {
	let cache: HybridWebCache;

	beforeEach(async () => {
		mockStorage(type);

		cache = new HybridWebCache("hwc", { storage: type });
		await cache.init();
	});

	describe("init", () => {

		it("should resolve without throwing an error", async () => {
			await expect(cache.init()).resolves.not.toThrow();
		});
		it("should return a resolved promise", async () => {
			const result = await cache.init();
			expect(result).toBeUndefined();
		});
		it("should not modify the instance state", async () => {
			const initialState = { ...cache };
			await cache.init();
			expect(cache).toEqual(initialState);
		});
	});

	describe("Auxiliary Functions", () => {
		it("should initialize with default options when constructed without parameters", () => {
			let storageType = type;
			if (type === StorageEngine.Auto) {
				storageType = cache.info.options.storage;
			}
			expect(cache.info).toEqual({
				dataBase: "hwc",
				size: "0b",
				options: {
					ttl: 1 * 60 * 60 * 1000,
					removeExpired: true,
					storage: storageType,
				},
			});

			expect(cache.storageType).toBe(cache.info.options.storage);
		});

		it("calculates bytes and size property correctly", () => {
			cache.unsetSync();
			expect(cache.length).toBe(0);
			expect(cache.bytes).toBe(0);

			cache.setSync("persons", { name: "John Doe", age: 30 });
			expect(cache.length).toBe(1);
			expect(cache.bytes).toBeGreaterThanOrEqual(50);
			expect(cache.info.size).toBeDefined();

			cache.setSync("persons", null);
			expect(cache.length).toBe(1);
			expect(cache.bytes).toBeGreaterThanOrEqual(50);
			expect(cache.info.size).toBeDefined();

			cache.unsetSync("persons");
			expect(cache.getJsonSync()).toBeNull();
		});
	});

	describe("set and get (Async/Sync)", () => {
		beforeEach(async () => {
			await cache.unset();
		});

		it("throws an error when keyPath is undefined or null", async () => {
			await expect(cache.set(undefined as any, null)).rejects.toThrowError("KeyPath cannot be undefined or null.");
			await expect(cache.set(null as any, null)).rejects.toThrowError("KeyPath cannot be undefined or null.");

			await expect(cache.get(undefined as any)).rejects.toThrowError("KeyPath cannot be undefined or null.");
			await expect(cache.get(null as any)).rejects.toThrowError("KeyPath cannot be undefined or null.");
		});
		it("throws an error when keyPath is undefined or null using sync method", () => {
			expect(() => cache.setSync(undefined as any, null)).toThrowError("KeyPath cannot be undefined or null.");
			expect(() => cache.setSync(null as any, null)).toThrowError("KeyPath cannot be undefined or null.");

			expect(() => cache.getSync(undefined as any)).toThrowError("KeyPath cannot be undefined or null.");
			expect(() => cache.getSync(null as any)).toThrowError("KeyPath cannot be undefined or null.");
		});

		it("returns undefined when the key does not exist in storage", async () => {
			const keyPath = "non-existent-key";

			expect(await cache.get(keyPath)).toBeUndefined();
			expect(cache.getSync(keyPath)).toBeUndefined();
		});

		it("should set/get a value for a non-existent keyPath", async () => {
			const keyPath = "test.key";
			const value = "test value";
			await cache.set(keyPath, value);
			expect((await cache.get(keyPath))?.value).toBe(value);
		});
		it("should setSync/getSync a value for a non-existent keyPath", () => {
			const keyPath = "testSync.key";
			const value = "test value";
			cache.setSync(keyPath, value);
			expect(cache.getSync(keyPath)?.value).toBe(value);
		});

		it("should update a value for an existing keyPath", async () => {
			const keyPath = "test.key";
			const initialValue = "initial value";
			const updatedValue = "updated value";
			await cache.set(keyPath, initialValue);
			await cache.set(keyPath, updatedValue);
			expect((await cache.get(keyPath))?.value).toBe(updatedValue);
		});
		it("should update sync a value for an existing keyPath", () => {
			const keyPath = "test.key";
			const initialValue = "initial value";
			const updatedValue = "updated value";
			cache.setSync(keyPath, initialValue);
			cache.setSync(keyPath, updatedValue);
			expect(cache.getSync(keyPath)?.value).toBe(updatedValue);
		});

		it("should set a value with a custom TTL with dataset expiration", async () => {
			const keyPath = "test.key";
			const value = "test value";
			const ttl = { seconds: 0.0001 }; // 1ms
			await cache.set(keyPath, value, ttl);

			// Wait for 5ms to ensure TTL expires
			await new Promise((resolve) => setTimeout(resolve, 5));

			// set to false to not remove expired
			let dataSet = await cache.get(keyPath, false);

			expect(dataSet?.value).toBe(value);
			expect(dataSet?.expiresAt).toBeLessThanOrEqual(Date.now());
			expect(dataSet?.isExpired).toBe(true);

			// set to true to remove expired
			dataSet = await cache.get(keyPath, true);
			expect(dataSet).toBeUndefined();
		});
		it("should setSync/getSync a value with a custom TTL with dataset expiration", async () => {
			const keyPath = "testSync.key";
			const value = "test value";
			const ttl = { seconds: 0.0001 }; // 1ms
			cache.setSync(keyPath, value, ttl);

			// Wait for 5ms to ensure TTL expires
			await new Promise((resolve) => setTimeout(resolve, 5));

			// set to false to not remove expired
			let dataSet = cache.getSync(keyPath, false);

			expect(dataSet?.value).toBe(value);
			expect(dataSet?.expiresAt).toBeLessThanOrEqual(Date.now());
			expect(dataSet?.isExpired).toBe(true);

			// set to true to remove expired
			dataSet = cache.getSync(keyPath, true);
			expect(dataSet).toBeUndefined();
		});

		it("should set a value with the default TTL", async () => {
			const keyPath = "test.key";
			const value = "test value";

			await cache.set(keyPath, value);

			const dataSet = await cache.get(keyPath);

			expect(dataSet?.value).toBe(value);
			expect(dataSet?.isExpired).toBe(false);
			expect(dataSet?.expiresAt).toBeGreaterThan(Date.now());
		});
		it("should setSync/getSync a value with the default TTL", async () => {
			const keyPath = "testSync.key";
			const value = "test value";

			cache.setSync(keyPath, value);

			const dataSet = cache.getSync(keyPath);

			expect(dataSet?.value).toBe(value);
			expect(dataSet?.isExpired).toBe(false);
			expect(dataSet?.expiresAt).toBeGreaterThan(Date.now());
		});

		it("should throw an error for an invalid keyPath", async () => {
			const value = "test value";
			await expect(cache.set(null as any, value)).rejects.toThrowError();
		});
		it("should throw an error for an invalid keyPath", () => {
			const value = "test value";
			expect(() => cache.setSync(null as any, value)).toThrowError();
		});

		it("should set/get number value", async () => {
			const keyPath = "numberKey";
			const value = 42;
			await cache.set(keyPath, value);
			expect((await cache.get(keyPath))?.value).toBe(value);
		});
		it("should setSync/getSync number value", () => {
			const keyPath = "numberKeySync";
			const value = 42;
			cache.setSync(keyPath, value);
			expect(cache.getSync(keyPath)?.value).toBe(value);
		});

		it("should set/get decimal value", async () => {
			const keyPath = "decimalKey";
			const value = 3.14;
			await cache.set(keyPath, value);
			expect((await cache.get(keyPath))?.value).toBe(value);
		});
		it("should setSync/getSync decimal value", () => {
			const keyPath = "decimalKeySync";
			const value = 3.14;
			cache.setSync(keyPath, value);
			expect(cache.getSync(keyPath)?.value).toBe(value);
		});

		it("should set/get boolean value", async () => {
			const keyPath = "booleanKey";
			const value = true;
			await cache.set(keyPath, value);
			expect((await cache.get(keyPath))?.value).toBe(value);
		});
		it("should setSync/getSync boolean value", () => {
			const keyPath = "booleanKeySync";
			const value = true;
			cache.setSync(keyPath, value);
			expect(cache.getSync(keyPath)?.value).toBe(value);
		});

		it("should set/get null value", async () => {
			const keyPath = "nullKey";
			const value = null;
			await cache.set(keyPath, value);
			expect((await cache.get(keyPath))?.value).toBe(value);
		});
		it("should setSync/getSync null value", () => {
			const keyPath = "nullKeySync";
			const value = null;
			cache.setSync(keyPath, value);
			expect(cache.getSync(keyPath)?.value).toBe(value);
		});

		it("should set/get an object value", async () => {
			const keyPath = "objectKey";
			const value = { name: "John Doe", age: 30 };
			await cache.set(keyPath, value);
			expect((await cache.get(keyPath))?.value).toEqual(value);
		});
		it("should setSync/getSync an object value", () => {
			const keyPath = "objectKeySync";
			const value = { name: "John Doe", age: 30 };
			cache.setSync(keyPath, value);
			expect(cache.getSync(keyPath)?.value).toEqual(value);
		});

		it("should set/get an array value", async () => {
			const keyPath = "arrayKey";
			const value = [1, 2, 3];
			await cache.set(keyPath, value);
			expect((await cache.get(keyPath))?.value).toEqual(value);
		});
		it("should setSync/getSync an array value", () => {
			const keyPath = "arrayKeySync";
			const value = [1, 2, 3];
			cache.setSync(keyPath, value);
			expect(cache.getSync(keyPath)?.value).toEqual(value);
		});

		it("should handle nested keyPath", async () => {
			const keyPath = ["nested", "key"];
			const value = "nested value";
			await cache.set(keyPath, value);
			expect((await cache.get(keyPath))?.value).toBe(value);
		});
		it("should handle nested keyPath using sync method", () => {
			const keyPath = ["nestedSync", "key"];
			const value = "nested value";
			cache.setSync(keyPath, value);
			expect(cache.getSync(keyPath)?.value).toBe(value);
		});

		it("should handle complex nested keyPath", async () => {
			const keyPath = ["complex", "nested", "key"];
			const value = { a: 1, b: { c: 2 } };
			await cache.set(keyPath, value);
			expect((await cache.get(keyPath.join(".")))?.value).toEqual(value);
		});
		it("should handle complex nested keyPath using sync method", () => {
			const keyPath = ["complexSync", "nested", "key"];
			const value = { a: 1, b: { c: 2 } };
			cache.setSync(keyPath.join("."), value);
			expect(cache.getSync(keyPath)?.value).toEqual(value);
		});
	});

	describe("getAll (Async/Sync)", () => {
		beforeEach(async () => {
			await cache.unset();
		});

		it("should return null if no items in storage", async () => {
			await cache.unset();
			const map = await cache.getAll();
			expect(map).toBeNull();
		});
		it("should return null if no items in storage using sync method", () => {
			cache.unsetSync();
			const map = cache.getAllSync();
			expect(map).toBeNull();
		});

		it("should return non-expired items", async () => {
			await cache.resetWith({ key: "value" });
			const map = await cache.getAll();

			const item = map!.get("key")!;
			const { expiresAt, ...resultWithoutExpiresAt } = item;

			expect(new Map([["key", resultWithoutExpiresAt]])).toEqual(new Map([["key", { value: "value", isExpired: false }]]));
		});
		it("should return non-expired items using sync method", () => {
			cache.resetWithSync({ key: "value" });
			const map = cache.getAllSync();

			const item = map!.get("key")!;
			const { expiresAt, ...resultWithoutExpiresAt } = item;

			expect(new Map([["key", resultWithoutExpiresAt]])).toEqual(new Map([["key", { value: "value", isExpired: false }]]));
		});

		it("should remove expired items if removeExpired is true", async () => {
			await cache.resetWith({ name: "John Doe", age: 30 }, { seconds: 0.0001 }); // 1ms TTL

			await new Promise((resolve) => setTimeout(resolve, 5)); // Wait for TTL to expire

			const map = await cache.getAll(true);
			expect(map).toBeNull();
		});
		it("should remove expired items if removeExpired is true using sync method", async () => {
			cache.resetWithSync({ name: "John Doe", age: 30 }, { seconds: 0.0001 }); // 1ms TTL

			await new Promise((resolve) => setTimeout(resolve, 5)); // Wait for TTL to expire

			const map = cache.getAllSync(true);
			expect(map).toBeNull();
		});

		it("should not remove expired items if removeExpired is false", async () => {
			const item1 = { name: "John Doe", age: 30 };
			const item2 = { name: "Jane Doe", age: 25 };

			await cache.set("key", [item1, item2], { seconds: 0.0001 }); // 1ms TTL

			await new Promise((resolve) => setTimeout(resolve, 5)); // Wait for TTL to expire

			const map = await cache.getAll(false);

			expect(map).toEqual(new Map([["key", { value: [item1, item2], expiresAt: expect.any(Number), isExpired: true }]]));
		});
		it("should not remove expired items if removeExpired is false using sync method", async () => {
			const item1 = { name: "John Doe", age: 30 };
			const item2 = { name: "Jane Doe", age: 25 };

			cache.setSync("key", [item1, item2], { seconds: 0.0001 }); // 1ms TTL

			await new Promise((resolve) => setTimeout(resolve, 5)); // Wait for TTL to expire

			const map = cache.getAllSync(false);

			expect(map).toEqual(new Map([["key", { value: [item1, item2], expiresAt: expect.any(Number), isExpired: true }]]));
		});

		it("should remove expired items and return non-expired items if removeExpired is true", async () => {
			const item1 = { name: "John Doe", age: 30 };
			const item2 = { name: "Jane Doe", age: 25 };

			await cache.set("key", [item1, item2], { seconds: 0.0001 }); // 1ms TTL

			await new Promise((resolve) => setTimeout(resolve, 5)); // Wait for TTL to expire
			const map = await cache.getAll(true);
			expect(map).toBeNull();
		});
		it("should remove expired items and return non-expired items if removeExpired is true using sync method", async () => {
			const item1 = { name: "John Doe", age: 30 };
			const item2 = { name: "Jane Doe", age: 25 };

			cache.setSync("key", [item1, item2], { seconds: 0.0001 }); // 1ms TTL

			await new Promise((resolve) => setTimeout(resolve, 5)); // Wait for TTL to expire
			const map = cache.getAllSync(true);
			expect(map).toBeNull();
		});
	});

	describe("getJson (Async/Sync)", () => {
		beforeEach(async () => {
			await cache.unset();
		});

		it("should retrieve all key-value pairs with no expired values", async () => {
			await cache.resetWith({ key1: "value1", key2: "value2" });

			const result = await cache.getJson();
			expect(result).toEqual({ key1: "value1", key2: "value2" });
		});
		it("should retrieve all key-value pairs with no expired values using sync method", () => {
			cache.resetWithSync({ key1: "value1", key2: "value2" });

			const result = cache.getJsonSync();
			expect(result).toEqual({ key1: "value1", key2: "value2" });
		});

		it("should retrieve all key-value pairs with expired values and removeExpired set to true", async () => {
			await cache.set("key1", "value1", { seconds: 0.0001 }); // 1ms TTL
			await cache.set("key2", "value2");
			await new Promise((resolve) => setTimeout(resolve, 5)); // Wait for TTL to expire
			const result = await cache.getJson(true);
			expect(result).toEqual({ key2: "value2" });
		});
		it("should retrieve all key-value pairs with expired values and removeExpired set to true using sync method", async () => {
			cache.setSync("key1", "value1", { seconds: 0.0001 }); // 1ms TTL
			cache.setSync("key2", "value2");

			await new Promise((resolve) => setTimeout(resolve, 5)); // Wait for TTL to expire
			const result = cache.getJsonSync(true);
			expect(result).toEqual({ key2: "value2" });
		});

		it("should retrieve all key-value pairs with expired values and removeExpired set to false", async () => {
			await cache.set("key1", "value1", { seconds: 0.0001 }); // 1ms TTL
			await cache.set("key2", "value2");

			await new Promise((resolve) => setTimeout(resolve, 5)); // Wait for TTL to expire
			const result = await cache.getJson(false);
			expect(result).toEqual({ key1: "value1", key2: "value2" });
		});
		it("should retrieve all key-value pairs with expired values and removeExpired set to false using sync method", async () => {
			cache.setSync("key1", "value1", { seconds: 0.0001 }); // 1ms TTL
			cache.setSync("key2", "value2");

			await new Promise((resolve) => setTimeout(resolve, 5)); // Wait for TTL to expire
			const result = cache.getJsonSync(false);
			expect(result).toEqual({ key1: "value1", key2: "value2" });
		});

		it("should return null when no items are in storage", async () => {
			await cache.unset();
			const result = await cache.getJson();
			expect(result).toBeNull();
		});
		it("should return null when no items are in storage using sync method", async () => {
			cache.unsetSync();
			const result = cache.getJsonSync();
			expect(result).toBeNull();
		});

		it("should return null when all items are expired and removed", async () => {
			await cache.unset();
			await cache.set("key1", "value1", { seconds: 0.0001 }); // 1ms TTL

			await new Promise((resolve) => setTimeout(resolve, 5)); // Wait for TTL to expire
			const result = await cache.getJson(true);
			expect(result).toBeNull();
		});
		it("should return null when all items are expired and removed using sync method", async () => {
			cache.unsetSync();
			cache.setSync("key1", "value1", { seconds: 0.0001 }); // 1ms TTL

			await new Promise((resolve) => setTimeout(resolve, 5)); // Wait for TTL to expire
			const result = cache.getJsonSync(true);
			expect(result).toBeNull();
		});

		it("should handle null values", async () => {
			await cache.set("key1", null);
			const result = await cache.getJson();
			expect(result).toEqual({ key1: null });
		});
		it("should handle null values using sync method", () => {
			cache.unsetSync();
			cache.setSync("key1", null);
			const result = cache.getJsonSync();
			expect(result).toEqual({ key1: null });
		});
	});

	describe("has (Async/Sync)", () => {

		it("throws an error if KeyPath is undefined or null", async () => {
			await expect(cache.has(undefined as any)).rejects.toThrowError("KeyPath cannot be undefined or null.");
			await expect(cache.has(null as any)).rejects.toThrowError("KeyPath cannot be undefined or null.");
		});
		it("throws an error if KeyPath is undefined or null using sync method", () => {
			expect(() => cache.hasSync(undefined as any)).toThrowError("KeyPath cannot be undefined or null.");
			expect(() => cache.hasSync(null as any)).toThrowError("KeyPath cannot be undefined or null.");
		});

		it("returns true if KeyPath matches the string representation of the key", async () => {
			const key = "hasKey";
			await cache.set(key, "testValue");
			expect(await cache.has(key)).toBe(true);
		});
		it("returns true if KeyPath matches the string representation of the key using sync method", () => {
			const key = "hasKey";
			cache.setSync(key, "testValue");
			expect(cache.hasSync(key)).toBe(true);
		});

		it("returns true if KeyPath does not match the string representation of the key and data exists", async () => {
			const keyPath = ["hasKey", "nestedKey"];
			await cache.set("hasKey", { nestedKey: "testValue" });
			expect(await cache.has(keyPath)).toBe(true);
		});
		it("returns true if KeyPath does not match the string representation of the key and data exists using sync method", () => {
			const keyPath = ["hasKey", "nestedKey"];
			cache.setSync("hasKey", { nestedKey: "testValue" });
			expect(cache.hasSync(keyPath)).toBe(true);
		});

		it("returns false if KeyPath does not match the string representation of the key and data does not exist", async () => {
			expect(await cache.has("nonExistentKey")).toBe(false);
		});
		it("returns false if KeyPath does not match the string representation of the key and data does not exist using sync method", () => {
			expect(cache.hasSync("nonExistentKey")).toBe(false);
		});

		it("returns false if KeyPath does not match the string representation of the key and data is null", async () => {
			const keyPath = ["hasKey", "nestedKey"];
			await cache.set(keyPath, null);

			expect(await cache.has(keyPath)).toBe(false); //null is false
		});
		it("returns false if KeyPath does not match the string representation of the key and data is null using sync method", () => {
			const keyPath = ["hasKey", "nestedKey"];
			cache.setSync(keyPath, null);

			expect(cache.hasSync(keyPath)).toBe(false); //null is false
		});
	});

	describe("unset (Async/Sync)", () => {
		beforeEach(async () => {
			await cache.unset();
		});

		it("should return false when storage is empty", async () => {
			expect(await cache.unset()).toBe(false);
			expect(cache.unsetSync()).toBe(false);
		});
		it("should return false when keyPath does not exist", async () => {
			await cache.set("key1", "value1");
			expect(await cache.unset("non-existent-key")).toBe(false);
			expect(cache.unsetSync("non-existent-key")).toBe(false);
		});

		it("should unset all key values when storage has some key-value pairs", async () => {
			await cache.set("key1", "value1");
			await cache.set("key2", "value2");
			expect(await cache.unset()).toBe(true);
			expect(await cache.getAll()).toBeNull();
		});
		it("should unset all key values when storage has some key-value pairs using sync method", () => {
			cache.setSync("key1", "value1");
			cache.setSync("key2", "value2");
			expect(cache.unsetSync()).toBe(true);
			expect(cache.getAllSync()).toBeNull();
		});

		it("should unset especific key values when storage has some key-value pairs ", async () => {
			localStorage.setItem("outherKey", "otherValue"); // Ensure other keys are not affected

			await cache.set("key1", "value1");
			await cache.set("key2", "value2");
			expect(await cache.unset("key1")).toBe(true);
			expect(await cache.getJson()).toEqual({ key2: "value2" });

			expect(localStorage.getItem("outherKey")).toBe("otherValue"); // Ensure other keys are not affected
		});
		it("should unset especific key values when storage has some key-value pairs using sync method", () => {
			localStorage.setItem("outherKey", "otherValue"); // Ensure other keys are not affected

			cache.setSync("key1", "value1");
			cache.setSync("key2", "value2");
			expect(cache.unsetSync("key2")).toBe(true);
			expect(cache.getJsonSync()).toEqual({ key1: "value1" });

			expect(localStorage.getItem("outherKey")).toBe("otherValue"); // Ensure other keys are not affected
		});

		it("should unset all key values when storage has expired key-value pairs", async () => {
			await cache.set("key1", "value1");

			expect(await cache.unset()).toBe(true);
			expect(await cache.getAll()).toBeNull();
		});
		it("should unset all key values when storage has expired key-value pairs using sync method", async () => {
			cache.setSync("key1", "value1", { hours: 1, minutes: 30, seconds: 0, days: 1 });

			expect(cache.unsetSync()).toBe(true);
			expect(cache.getAllSync()).toBeNull();
		});

		it("should unset all key values when storage has a mix of expired and non-expired key-value pairs", async () => {
			await cache.set("key1", "value1", { seconds: 0.0001 });
			await cache.set("key2", "value2");

			expect(await cache.unset()).toBe(true);
			expect(await cache.getAll()).toBeNull();
		});
		it("should unset all key values when storage has a mix of expired and non-expired key-value pairs using sync method", () => {
			cache.setSync("key1", "value1", { days: 2 });
			cache.setSync("key2", "value2");

			expect(cache.unsetSync()).toBe(true);
			expect(cache.getAllSync()).toBeNull();
		});
	});

	describe("resetWith (Async/Sync)", () => {

		it("should reset with single key-value pair", async () => {
			const keyValues = { foo: "bar" };
			await cache.resetWith(keyValues);
			expect((await cache.get("foo"))?.value).toBe("bar");
		});
		it("should reset sync with single key-value pair", () => {
			const keyValues = { fooSync: "bar" };
			cache.resetWithSync(keyValues);
			expect(cache.getSync("fooSync")?.value).toBe("bar");
		});

		it("should reset with multiple key-value pairs", async () => {
			const keyValues = { foo: "bar", baz: "qux" };
			await cache.resetWith(keyValues);
			expect((await cache.get("foo"))?.value).toBe("bar");
			expect((await cache.get("baz"))?.value).toBe("qux");
		});
		it("should reset sync with multiple key-value pairs", () => {
			const keyValues = { fooSync: "bar", bazSync: "qux" };
			cache.resetWithSync(keyValues);
			expect(cache.getSync("fooSync")?.value).toBe("bar");
			expect(cache.getSync("bazSync")?.value).toBe("qux");
		});

		it("should reset with TTL", async () => {
			const keyValues = { foo: "bar" };
			const ttl = { seconds: 0.01 }; // 100ms
			await cache.resetWith(keyValues, ttl);

			let dataSet = await cache.get("foo", false);

			expect(dataSet?.value).toBe("bar");
			expect(dataSet?.isExpired).toBe(false);

			// Wait for 200ms to ensure TTL expires
			await new Promise((resolve) => setTimeout(resolve, 200));

			dataSet = await cache.get("foo", false);
			expect(dataSet?.isExpired).toBe(true);
		});
		it("should reset sync with TTL", async () => {
			const keyValues = { fooSync: "bar" };
			const ttl = { seconds: 0.01 }; // 100ms
			cache.resetWithSync(keyValues, ttl);

			let dataSet = await cache.get("fooSync", false);

			expect(dataSet?.value).toBe("bar");
			expect(dataSet?.isExpired).toBe(false);

			// Wait for 200ms to ensure TTL expires
			await new Promise((resolve) => setTimeout(resolve, 200));

			dataSet = await cache.get("fooSync", false);
			expect(dataSet?.isExpired).toBe(true);
		});

		it("should reset without TTL (uses default TTL)", async () => {
			const keyValues = { foo: "bar" };
			await cache.resetWith(keyValues);
			expect((await cache.get("foo"))?.value).toBe("bar");

			// Verify default TTL is used
			const dataSet = await cache.get("foo");
			expect(dataSet?.expiresAt).toBeGreaterThan(Date.now());
		});
		it("should reset sync without TTL (uses default TTL)", async () => {
			const keyValues = { fooSync: "bar" };
			cache.resetWithSync(keyValues);
			expect((await cache.get("fooSync"))?.value).toBe("bar");

			// Verify default TTL is used
			const dataSet = await cache.get("fooSync");
			expect(dataSet?.expiresAt).toBeGreaterThan(Date.now());
		});

		it("should reset with empty key-value pairs", async () => {
			const keyValues = {};
			await cache.resetWith(keyValues);
			expect(await cache.getAll()).toBeNull();
		});
		it("should reset sync with empty key-value pairs", () => {
			const keyValues = {};
			cache.resetWithSync(keyValues);
			expect(cache.getAllSync()).toBeNull();
		});
	});
});

function mockStorage(type: StorageEngine) {
	switch (type) {
		case StorageEngine.LocalStorage:
		case StorageEngine.SessionStorage: {
			const storage = type === StorageEngine.LocalStorage ? "localStorage" : "sessionStorage";
			Object.defineProperty(window, storage, {
				value: (() => {
					let store: Record<string, string> = {};
					return {
						getItem: (key: string) => store[key] || null,
						setItem: (key: string, value: string) => (store[key] = value),
						removeItem: (key: string) => delete store[key],
						clear: () => (store = {}),
						key: (index: number) => Object.keys(store)[index] || null,
						get length() {
							return Object.keys(store).length;
						},
					};
				})(),
				writable: true,
			});

			// Clear localStorage before each test
			if (type === StorageEngine.LocalStorage) localStorage.clear();
			else sessionStorage.clear();
			break;
		}

		case StorageEngine.IndexedDB:
			Object.defineProperty(window, "indexedDB", {
				value: new FDBFactory(),
				writable: true,
			});
			break;

		default:
			break;
	}
}
