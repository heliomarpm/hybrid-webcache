/**
 * Enum representing the different storage engines that can be used.
 *
 * @category Enumarate
 * @defaultValue Auto
 */
export enum StorageEngine {
	/**
	 * Automatically selects the best available storage engine based on browser support.
	 */
	Auto = 0,
	/**
	 * Uses the browser's local storage for caching, with synchronization between tabs via `BroadcastChannel`.
	 */
	LocalStorage = 1,
	/**
	 * Uses IndexedDB for caching, with synchronization between tabs via `BroadcastChannel`.
	 */
	IndexedDB = 2,
	/**
	 * Uses the browser's session storage for caching, isolated per tab.
	 */
	SessionStorage = 3,
	/**
	 * Uses in-memory storage for caching, synchronization only with the instance itself.
	 */
	Memory = 4,
}

/**
 * Interface representing a data model stored in the cache.
 *
 * @template T - The type of the value stored.
 * @property {T} value - The value stored in the cache.
 * @property {number} expiresAt - The timestamp in milliseconds when the value expires.
 *
 * @category Model
 * @internal
 * @ignore
 */
export interface DataModel<T> {
	value: T;
	expiresAt: number;
}

/**
 * Interface representing a data model retrieved from the cache.
 *
 * @template T - The type of the value stored.
 * @extends DataModel<T>
 * @property {T} value - The value stored in the cache.
 * @property {number} expiresAt - The timestamp in milliseconds when the value expires.
 * @property {boolean} isExpired - Whether the value has expired.
 *
 * @category Model
 */
export interface DataGetModel<T> extends DataModel<T> {
	isExpired: boolean;
}

/**
 * `KeyPath` is a type that represents a key path in a key-value pair.
 *
 * It can be a string or an array of strings.
 * @example
 * ```ts
 * const cache = new HybridWebCache();
 *
 * const keyPath: KeyPath = "user.name";
 * const keyPathArray: KeyPath = ["wife", "name"];
 *
 * await cache.set(keyPath, "John Doe");
 * await cache.set(keyPathArray, "Jane Doe");
 * ```
 *
 * @category Types
 **/
export type KeyPath = string | Array<string>;

/**
 * `ValueType` is a type that represents the possible values that can be stored in a key-value pair.
 *
 * It can be null, string, number, boolean, object, DictionaryType, or an array of ValueType.
 * @example
 * ```ts
 * await cache.set("createdAt", "2023-04-16");
 * await cache.set("levels", [1, 2, 3]);
 * await cache.set("family, [{ name: "John" }, { name: "Jane" }]);
 * ```
 *
 * @category Types
 * @see {@link DictionaryType}
 */
export type ValueType = null | string | number | boolean | object | DictionaryType | Array<ValueType>;

/**
 * `DictionaryType` is a type that represents an object with string keys and values of type `ValueType`.
 *
 * This type is used to define a dictionary-like structure where each key maps to a value of various types.
 *
 * @category Types
 * @see {@link ValueType}
 * @internal
 */
export type DictionaryType = { [key: string]: ValueType };

/**
 * `RecordType` is a type that represents an object with string keys and values of type `T`, where `T` is a subtype of `ValueType`.
 *
 * This type is used to define the structure of key-value pairs.
 *
 * @template T - The type of the values in the record.
 * @example
 * ```ts
 * await cache.resetWith({ family: [{ name: "John" }, { name: "Jane" }] });
 * ```
 * @category Types
 */
export type RecordType<T extends ValueType> = Record<string, T>;

/**
 * Type representing a time to live (TTL) value, which can be a number or an object with seconds, minutes, hours, or days properties.
 *
 * @example
 * ```ts
 * const cache5m = new HybridWebCache("CacheDB", {ttl: 300000});
 * const cache10m = new HybridWebCache("CacheDB", {ttl: { minutes: 10 }});
 * const cache = new HybridWebCache("CacheDB", {ttl: {hours: 6, days: 1}});
 * ```
 * @category Types
 */
export type TTL = number | { seconds?: number; minutes?: number; hours?: number; days?: number };

/**
 * `Options` types contain all the configuration options that can be set in the constructor
 *
 * @property {StorageEngine} storage - The storage engine to use.
 * @property {Partial<TTL>} ttl - The time to live for data in the cache.
 * @property {boolean} removeExpired - Automatically removes expired items when attempting to access them.
 *
 * @default
 * ```ts
 * //options
 * {
 * 	ttl: { seconds: 0, minutes: 0, hours: 1, days: 0 },
 * 	removeExpired: true,
 * 	storage: StorageType.Auto
 * }
 * ```
 * @category Types
 */
export type Options = {
	storage: StorageEngine;
	ttl: Partial<TTL>;
	removeExpired: boolean;
};
