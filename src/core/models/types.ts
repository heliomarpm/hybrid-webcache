
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
 * Interface representing a single data model in the cache.
 *
 * @property value - The value stored in the cache.
 * @property expiresAt - The timestamp in milliseconds when the value expires.
 *
 * @category Model
 * @internal
 */
export interface DataModel<T> {
	value: T;
	expiresAt: number;
}

/**
 * Interface representing a data model that is returned from the cache.
 * Extends the DataModel interface with an additional isExpired property.
 *
 * @property value - The value stored in the cache.
 * @property expiresAt - The timestamp in milliseconds when the value expires.
 * @property isExpired - A boolean indicating whether the value has expired.
 *
 * @category Model
 */
export interface DataGetModel<T> extends DataModel<T> {
	isExpired: boolean;
}

/**
 * Type representing a value that can be stored in the cache.
 * Can be null, a string, a number, a boolean, an object, a DictionaryType, or an array of ValueType.
 *
 * @category Types
 */
export type ValueType = null | string | number | boolean | object | DictionaryType | Array<ValueType>;

/**
 * Type representing a record with string keys and values of type T.
 * @template T - The type of the values in the record.
 *
 * @category Types
 */
export type RecordType<T extends ValueType> = Record<string, T>;

/**
 * Type representing a key path, which can be a string or an array of strings.
 *
 * @category Types
 */
export type KeyPath = string | Array<string>;

/**
 * Type representing a time to live (TTL) value, which can be a number or an object with seconds, minutes, hours, or days properties.
 *
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
 * @category Types
 */
export type Options = {
	storage: StorageEngine;
	ttl: Partial<TTL>;
	removeExpired: boolean;
};

/**
 * `DictionaryType` is a type that represents an object with string keys and values of type `ValueType`.
 *
 * This type is used to define a dictionary-like structure where each key maps to a value of various types.
 * @internal
 * @ignore
 */
type DictionaryType = { [key: string]: ValueType };
