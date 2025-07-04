import { get as _get, set as _set, unset as _unset } from "lodash";
import { StorageFactory } from "./StorageFactory";
import type { DataGetModel, DataModel, KeyPath, Options, RecordType, StorageBase, TTL, ValueType } from "./types";
import { StorageEngine } from "./types";
import { Utils } from "./utils";

/**
 * @internal
 */
const defaultOptions: Options = {
	ttl: { seconds: 0, minutes: 0, hours: 1, days: 0 },
	removeExpired: true,
	storage: StorageEngine.Auto,
};

/**
 * Represents a hybrid web cache that supports both asynchronous and synchronous
 * operations for storing, retrieving, and managing key-value pairs with optional
 * time-to-live (TTL) settings.
 *
 * The cache can automatically remove expired entries
 * and supports various storage engines.
 *
 * Provides methods for setting, getting,
 * checking existence, and unsetting values, as well as resetting the cache with
 * new data. Includes utility functions for converting TTL and calculating storage
 * size.
 * @author Heliomar Marques
 * @example
 *
 * Basic Usage with Default Options (storage: Auto, ttl: 1 hour)
 * ```ts
 * import { HybridWebCache, StorageEngine } from 'hybrid-webcache';
 *
 * const cache = new HybridWebCache();
 *
 * await cache.set('sessionToken', 'abc123');
 * const tokenData = await cache.get<string>('sessionToken');
 * console.log(`Token: ${tokenData?.value}`); // Output: Token: abc123
 * console.log(`Is Expired: ${tokenData?.isExpired}`); // Output: Is Expired: false
 * ```
 * @example
 * Creating an instance with custom options (e.g., IndexedDB, 10-minute TTL)
 * ```ts
 * import { HybridWebCache, StorageEngine } from 'hybrid-webcache';
 *
 * // Note: For IndexedDB, remember to call .init() if you plan to use synchronous methods
 * const indexedDBCache = new HybridWebCache('myAppCache', {
 *   storage: StorageEngine.IndexedDB,
 *   ttl: { minutes: 10 },
 *   removeExpired: true,
 * });
 *
 * await indexedDBCache.init(); // Initialize IndexedDB to load memory cache for sync operations
 * //Setting and Getting Nested Data
 * await indexedDBCache.set('user.profile.firstName', 'John', { hours: 1 });
 * indexedDBCache.setSync('user.profile.lastName', 'Doe'); // Uses instance's default TTL (10 minutes)
 * indexedDBCache.setSync(['user', 'profile', 'age'], 30); // Array KeyPath
 *
 * const userData = await indexedDBCache.get('user.profile');
 * console.log(userData?.value); // Output: { firstName: 'John', lastName: 'Doe', age: 30 }
 * const firstNameData = indexedDBCache.getSync('user.profile.firstName');
 * console.log(firstNameData?.value); // Output: John
 *
 * // Checking for Key Existence
 * const hasUser = await indexedDBCache.has('user.profile.firstName');
 * console.log(`Has user first name: ${hasUser}`); // Output: Has user first name: true
 *
 * const hasNonExistentKey = indexedDBCache.hasSync('non.existent.key');
 * console.log(`Has non-existent key: ${hasNonExistentKey}`); // Output: Has non-existent key: false
 *
 * // Unsetting Data (Partial and Full)
 * const complexObject = {
 *   theme: 'dark',
 *   settings: {
 *     language: 'en-US',
 *     notifications: { email: true, sms: false }
 *   }
 * };
 * await indexedDBCache.set('appConfig', complexObject);
 *
 * // Unset a nested property
 * await indexedDBCache.unset('appConfig.settings.notifications.sms');
 * const updatedAppConfig = await indexedDBCache.get('appConfig');
 * console.log(updatedAppConfig?.value);
 * // Output: { theme: 'dark', settings: { language: 'en-US', notifications: { email: true } } }
 *
 * // Unset an array element (sets to null)
 * indexedDBCache.unsetSync('appConfig.items[1]');
 * const updatedItems = indexedDBCache.getSync('appConfig.items');
 * console.log(updatedItems?.value); // Output: ['apple', null, 'orange']
 *
 * // Unset the entire 'appConfig' key
 * await indexedDBCache.unset('appConfig');
 * const appConfigAfterUnset = await indexedDBCache.get('appConfig');
 * console.log(appConfigAfterUnset); // Output: undefined
 *
 * // Retrieving All Data
 * await indexedDBCache.set('product1', { id: 1, name: 'Laptop' });
 * await indexedDBCache.set('product2', { id: 2, name: 'Mouse' });
 *
 * const allItemsMap = await indexedDBCache.getAll();
 * console.log(allItemsMap);
 * /* Output:
 * Map(2) {
 *   'product1' => { value: { id: 1, name: 'Laptop' }, expiresAt: ..., isExpired: false },
 *   'product2' => { value: { id: 2, name: 'Mouse' }, expiresAt: ..., isExpired: false }
 * }
 * *\/
 *
 * const allItemsJson = indexedDBCache.getJsonSync();
 * console.log(allItemsJson);
 * /* Output:
 * {  product1: { id: 1, name: 'Laptop' },
 *    product2: { id: 2, name: 'Mouse' }
 * } *\/
 *
 * // Resetting the Cache
 * await indexedDBCache.resetWith({
 *   user: { id: 'user123', status: 'active' },
 *   app: { version: '1.0.0' }
 * }, { minutes: 5 }); // New TTL for reset
 *
 * const resetData = await indexedDBCache.getJson();
 * console.log(resetData);
 * /* Output:
 * {
 *   user: { id: 'user123', status: 'active' },
 *   app: { version: '1.0.0' }
 * } *\/
 *
 * // Getting Cache Info
 * const cacheInfo = indexedDBCache.info;
 * console.log(cacheInfo);
 * /* Output:
 * {
 *   dataBase: 'myAppCache',
 *   size: 'XXb', // e.g., '120b'
 *   options: {
 *     ttl: 300000, // 5 minutes in ms
 *     removeExpired: true,
 *     storage: 2 // StorageEngine.IndexedDB
 *   }
 * } *\/
 * ```
 *
 * @category Core
 */
export class HybridWebCache {
	/**
	 * Basename
	 * @private
	 */
	private baseName: string;

	/**
	 * The options for the Cache.
	 * @type {@link Options}
	 * @private
	 */
	private options: Options;

	/** @ignore */
	private storageBase: StorageBase;

	/**
	 * Constructor for Hybrid WebCache.
	 *
	 * To reset the cache, use [`resetWith()`|`resetWithSync()`].
	 *
	 * _**Note:**_ For `StorageType.IndexedDB`, remember to call .init() if you plan to use synchronous methods
	 *
	 * @param {string} [baseName='HybridWebCache'] - The base name of the cache.
	 * @param {Partial<Options>} options
	 * @default
	 * ```ts
	 * //options
	 * {
	 * 	ttl: { seconds: 0, minutes: 0, hours: 1, days: 0 },
	 * 	removeExpired: true,
	 * 	storage: StorageType.Auto
	 * }
	 * ```
	 */
	constructor(baseName = "HybridWebCache", options?: Partial<Options>) {
		this.baseName = baseName;
		this.options = { ...defaultOptions, ...options };

		this.storageBase = this.determineStorageEngine(this.options.storage);
		this.options.storage = this.storageBase.type;
	}

	private determineStorageEngine(storage: StorageEngine): StorageBase {
		return StorageFactory.createStorage(storage, this.baseName);
	}

	private createKey(keyPath: KeyPath): string {
		return Utils.getKey(keyPath);
	}

	private prepareDataSet<T extends ValueType>(value: T, ttl: Partial<TTL> = this.options.ttl) {
		const ttlMs = Utils.convertTTLToMilliseconds(ttl);
		const expiresAt = ttlMs > 0 ? Date.now() + ttlMs : 0;
		const data: DataModel<T> = { value, expiresAt };

		return { data };
	}

	/**
	 * Initializes the memory cache
	 *
	 * This method is only necessary to use the synchronous functions of the IndexedDB strategy.
	 *
	 * @return A promise that resolves when the local storage is initialized.
	 *
	 * @example
	 *
	 * ```ts
	 * const cache = new HybridWebCache("CacheDB", {storage: StorageEngine.IndexedDB});
	 * await cache.init();
	 * ```
	 *
	 * @category Init Method
	 */
	public async init(): Promise<void> {
		await this.storageBase.init();
	}

	/**
	 * Sets the value for a given keyPath in the storage engine.
	 *
	 * If the keyPath already exists, its value is updated with the provided
	 * value. If the keyPath does not exist, a new entry is created with the
	 * provided TTL.
	 *
	 * @template {@link ValueType} T - The type of the value being stored.
	 * @param {@link KeyPath} keyPath - The keyPath to be stored.
	 * @param {@link ValueType} value - The value to be stored.
	 * @param {@link TTL} ttl - Optional TTL settings for the stored value. Defaults to
	 *              the instance's configured TTL.
	 *
	 * @example
	 *
	 * Change the value at `color.name` to `sapphire`.
	 * ```ts
	 * // Given:
	 * {
	 * 	"color": {
	 *		"name": "cerulean",
	 *		"code": {
	 *			"rgb": [0, 179, 230],
	 *			"hex": "#003BE6"
	 *		}
	 *	}
	 * }
	 *
	 * const cache = new HybridWebCache();
	 * await cache.set('color.name', 'sapphire');
	 * ```
	 * @example
	 *
	 * Set the value of `color.hue` to `bluish`.
	 * ```ts
	 * const cache = new HybridWebCache();
	 * await cache.set(['color', 'hue'], 'bluish);
	 * ```
	 * @example
	 *
	 * Change the value of `color.code`.
	 * ```ts
	 * const cache = new HybridWebCache();
	 * await cache.set('color.code', { rgb: [16, 31, 134], hex: '#101F86' });
	 * ```
	 *
	 * @category Set Methods
	 */
	async set<T extends ValueType>(keyPath: KeyPath, value: T, ttl: Partial<TTL> = this.options.ttl): Promise<void> {
		if (keyPath === undefined || keyPath === null) {
			throw new Error("KeyPath cannot be undefined or null.");
		}

		const key = this.createKey(keyPath);
		const data = await this.storageBase.get(key);
		const obj = data?.value || {};

		_set(obj as object, keyPath, value);
		const dataSet = this.prepareDataSet(obj, ttl);

		return this.storageBase.set(key, dataSet.data);
	}

	/**
	 * Synchronous version of set.
	 *
	 * @template T - The type of the value being stored.
	 * @param keyPath - The keyPath to be stored.
	 * @param value - The value to be stored.
	 * @param ttl - Optional TTL settings for the stored value. Defaults to
	 *              the instance's configured TTL.
	 *
	 * @example
	 *
	 * Change the value at `color.name` to `sapphire`.
	 * ```ts
	 * // Given:
	 * {
	 * 	"color": {
	 *		"name": "cerulean",
	 *		"code": {
	 *			"rgb": [0, 179, 230],
	 *			"hex": "#003BE6"
	 *		}
	 *	}
	 * }
	 * cache.setSync('color.name', 'sapphire');
	 * ```
	 * @example
	 *
	 * Set the value of `color.hue` to `bluish`.
	 * ```ts
	 * cache.setSync(['color', 'hue'], 'bluish);
	 * ```
	 * @example
	 *
	 * Change the value of `color.code`.
	 * ```ts
	 * cache.setSync('color.code', { rgb: [16, 31, 134], hex: '#101F86' });
	 * ```
	 *
	 * @category Set Methods
	 */
	setSync<T extends ValueType>(keyPath: KeyPath, value: T, ttl: Partial<TTL> = this.options.ttl): void {
		if (keyPath === undefined || keyPath === null) {
			throw new Error("KeyPath cannot be undefined or null.");
		}

		const key = this.createKey(keyPath);
		const data = this.storageBase.getSync(key);
		const obj = data?.value || {};

		_set(obj as object, keyPath, value);

		const dataSet = this.prepareDataSet(obj, ttl);

		this.storageBase.setSync(key, dataSet.data);
	}

	/**
	 * Retrieves the value associated with the specified keyPath from the storage engine.
	 *
	 * If the value is found, it returns an object containing the value, expiration time,
	 * and expiration status. If the value is expired and the `removeExpired` flag is set
	 * to true, the expired value is removed from storage and `undefined` is returned.
	 *
	 * @template T - The type of the value being retrieved.
	 * @param keyPath - The path to the key whose value should be retrieved.
	 * @param removeExpired - A flag indicating whether to remove the key if its value
	 *                        is expired. Defaults to the instance's configured setting.
	 * @returns A promise that resolves to an object containing the value and its metadata,
	 *          or `undefined` if the value does not exist or is expired and removed.
	 *
	 * @example
	 *
	 * Get the value at `color.name`.
	 * ```ts
	 * // Given:
	 * {
	 * 	"color": {
	 *		"name": "cerulean",
	 *		"code": {
	 *			"rgb": [0, 179, 230],
	 *			"hex": "#003BE6"
	 *		}
	 *	}
	 * }
	 * const cache = new HybridWebCache();
	 * const value = await cache.get('color.name');
	 * // => "cerulean"
	 * ```
	 * @example
	 *
	 * Get the value at `color.code.hex`.
	 * ```ts
	 * const hex = await cache.get('color.color.hex');
	 * // => "#003BE6"
	 * ```
	 * @example
	 *
	 * Get the value at `color.hue`.
	 * ```ts
	 * const value = await cache.get(['color', 'hue']);
	 * // => undefined
	 * ```
	 * @example
	 *
	 * Get the value at `color.code.rgb[1]`.
	 * ```ts
	 * const value = await cache.get('color.code.rgb[1]');
	 * // => 179
	 * ```
	 *
	 * @category Get Methods
	 */
	async get<T extends ValueType>(keyPath: KeyPath, removeExpired: boolean = this.options.removeExpired): Promise<DataGetModel<T> | undefined> {
		if (keyPath === undefined || keyPath === null) {
			throw new Error("KeyPath cannot be undefined or null.");
		}

		const key = this.createKey(keyPath);
		const data = await this.storageBase.get(key);

		if (data) {
			const value = _get(data.value, keyPath);

			if (value === undefined) {
				return;
			}

			const isExpired = Utils.isExpired(data.expiresAt);
			if (removeExpired && isExpired) {
				await this.unset(keyPath);
				return;
			}

			return {
				value,
				expiresAt: data.expiresAt,
				isExpired,
			} as DataGetModel<T>;
		}

		return;
	}

	/**
	 * Synchronous version of get.
	 *
	 * Retrieves the value associated with the specified keyPath from the storage engine.
	 *
	 * If the value is found, it returns an object containing the value, expiration time,
	 * and expiration status. If the value is expired and the `removeExpired` flag is set
	 * to true, the expired value is removed from storage and `undefined` is returned.
	 *
	 * @template T - The type of the value being retrieved.
	 * @param keyPath - The path to the key whose value should be retrieved.
	 * @param removeExpired - A flag indicating whether to remove the key if its value
	 *                        is expired. Defaults to the instance's configured setting.
	 * @returns An object containing the value and its metadata, or `undefined` if the
	 *          value does not exist or is expired and removed.
	 * @example
	 *
	 * Get the value at `color.name`.
	 * ```ts
	 * // Given:
	 * {
	 * 	"color": {
	 *		"name": "cerulean",
	 *		"code": {
	 *			"rgb": [0, 179, 230],
	 *			"hex": "#003BE6"
	 *		}
	 *	}
	 * }
	 *
	 * const value = cache.getSync('color.name');
	 * // => "cerulean"
	 * ```
	 * @example
	 *
	 * Get the value at `color.code.hex`.
	 * ```ts
	 * const hex = cache.getSync('color.color.hex');
	 * // => "#003BE6"
	 * ```
	 * @example
	 *
	 * Get the value at `color.hue`.
	 * ```ts
	 * const value = cache.getSync(['color', 'hue']);
	 * // => undefined
	 * ```
	 * @example
	 *
	 * Get the value at `color.code.rgb[1]`.
	 * ```ts
	 * const value = cache.getSync('color.code.rgb[1]');
	 * // => 179
	 * ```
	 *
	 * @category Get Methods
	 */
	getSync<T extends ValueType>(keyPath: KeyPath, removeExpired: boolean = this.options.removeExpired): DataGetModel<T> | undefined {
		if (keyPath === undefined || keyPath === null) {
			throw new Error("KeyPath cannot be undefined or null.");
		}

		const key = this.createKey(keyPath);
		const data = this.storageBase.getSync(key);

		if (data) {
			const value = _get(data.value, keyPath);

			if (value === undefined) {
				return;
			}

			const isExpired = Utils.isExpired(data.expiresAt);
			if (removeExpired && isExpired) {
				this.unsetSync(keyPath);
				return;
			}

			return {
				value,
				expiresAt: data.expiresAt,
				isExpired,
			} as DataGetModel<T>;
		}

		return;
	}

	/**
	 * Retrieves all key-value pairs from the storage engine.
	 *
	 * If the `removeExpired` flag is set to true, expired values are removed from storage
	 * before being returned.
	 *
	 * @param removeExpired - A flag indicating whether to remove expired values from storage.
	 *                        Defaults to the instance's configured setting.
	 * @returns A map of key-value pairs, where each value is an object containing the value,
	 *          expiration time, and expiration status. If no values are found or if all values
	 *          are expired and removed, `null` is returned.
	 *
	 * @category Get Methods
	 */
	async getAll<T extends ValueType>(removeExpired: boolean = this.options.removeExpired): Promise<Map<string, DataGetModel<T>> | null> {
		const allItems = await this.storageBase.getAll();
		if (!allItems) {
			return null;
		}

		const result: Map<string, DataGetModel<T>> = new Map();

		for (const [key, data] of allItems) {
			const [iKey, iValue] = Object.entries(data.value ?? { key, value: null })[0];

			// Check if the item is expired
			const isExpired = Utils.isExpired(data.expiresAt);

			// If `removeExpired` is true and the item is expired, remove it and skip adding to result
			if (removeExpired && isExpired) {
				await this.unset(iKey);
				continue;
			}

			result.set(iKey, {
				value: iValue as T,
				expiresAt: data.expiresAt,
				isExpired,
			});
		}

		return Promise.resolve(result.size > 0 ? result : null);
	}

	/**
	 * Synchronously retrieves all items from storage as a map of key-value pairs,
	 * where each value is an object containing the value, expiration time, and expiration status.
	 *
	 * If the `removeExpired` flag is set to true, expired values are removed from storage
	 * before being returned.
	 *
	 * @param removeExpired - A flag indicating whether to remove expired values from storage.
	 *                        Defaults to the instance's configured setting.
	 * @returns A map of key-value pairs, where each value is an object containing the value,
	 *          expiration time, and expiration status. If no values are found or if all values
	 *          are expired and removed, `null` is returned.
	 *
	 * @category Get Methods
	 */
	getAllSync<T extends ValueType>(removeExpired: boolean = this.options.removeExpired): Map<string, DataGetModel<T>> | null {
		const allItems = this.storageBase.getAllSync();
		if (!allItems) {
			return null;
		}

		const result: Map<string, DataGetModel<T>> = new Map();

		for (const [key, data] of allItems) {
			const [iKey, iValue] = data.value ? Object.entries(data.value)[0] : [key, null];

			// Check if the item is expired
			const isExpired = Utils.isExpired(data.expiresAt);

			// If `removeExpired` is true and the item is expired, remove it and skip adding to result
			if (removeExpired && isExpired) {
				this.unsetSync(iKey);
				continue;
			}

			result.set(iKey, {
				value: iValue as T,
				expiresAt: data.expiresAt,
				isExpired,
			});
		}

		return result.size > 0 ? result : null;
	}

	/**
	 * Asynchronously retrieves all key-value pairs from the storage as a JSON object.
	 *
	 * If the `removeExpired` flag is set to true, expired values are removed from storage
	 * before being included in the result.
	 *
	 * @param removeExpired - A flag indicating whether to remove expired values from storage.
	 *                        Defaults to the instance's configured setting.
	 * @returns A promise that resolves to a JSON object containing all key-value pairs.
	 *          If no items are found or all items are expired and removed, `null` is returned.
	 *
	 * @category Get Methods
	 */
	async getJson(removeExpired: boolean = this.options.removeExpired): Promise<Record<string, ValueType> | null> {
		const allValues: Record<string, ValueType> = {};
		const allItems = await this.getAll(removeExpired);

		if (!allItems) {
			return null;
		}

		for (const [key, data] of allItems) {
			if (data && data.value !== undefined) {
				allValues[key] = data.value;
			}
		}

		return allValues;
	}

	/**
	 * Synchronously retrieves all key-value pairs from the storage as a JSON object.
	 *
	 * If the `removeExpired` flag is set to true, expired values are removed from storage
	 * before being included in the result.
	 *
	 * @param removeExpired - A flag indicating whether to remove expired values from storage.
	 *                        Defaults to the instance's configured setting.
	 * @returns A JSON object containing all key-value pairs. If no items are found or all
	 *          items are expired and removed, `null` is returned.
	 *
	 * @category Get Methods
	 */
	getJsonSync(removeExpired: boolean = this.options.removeExpired): Record<string, ValueType> | null {
		const allValues: Record<string, ValueType> = {};
		const allItems = this.getAllSync(removeExpired);

		if (!allItems) {
			return null;
		}

		for (const [key, data] of allItems) {
			if (data && data.value !== undefined) {
				allValues[key] = data.value;
			}
		}

		return allValues;
	}

	/**
	 * Checks if the given key path exists.
	 *
	 * _For sync method, use_ [`hasSync()`].
	 *
	 * @param keyPath The key path to check.
	 * @returns A promise which resolves to `true` if the `keyPath` exists, else `false`.
	 * @example
	 *
	 * Check if the value at `color.name` exists.
	 * ```ts
	 * // Given:
	 * {
	 * 	"color": {
	 *		"name": "cerulean",
	 *		"code": {
	 *			"rgb": [0, 179, 230],
	 *			"hex": "#003BE6"
	 *		}
	 *	}
	 * }
	 *
	 * const exists = await cache.has('color.name');
	 * // => true
	 * ```
	 * @example
	 *
	 * Check if the value at `color.hue` exists.
	 * ```ts
	 * const exists = await cache.has(['color', 'hue']);
	 * // => false
	 * ```
	 *  @example
	 *
	 * Check if the value at `color.code.rgb[1]` exists.
	 * ```ts
	 * const exists = await cache.has(color.code.rgb[1]);
	 * // => true
	 * ```
	 *
	 * @category Has Methods
	 */
	async has(keyPath: KeyPath): Promise<boolean> {
		if (keyPath === undefined || keyPath === null) {
			throw new Error("KeyPath cannot be undefined or null.");
		}

		const key = this.createKey(keyPath);

		if (key === keyPath.toString()) {
			return this.storageBase.has(key);
		}

		const data = await this.get(keyPath);
		return data !== undefined && data?.value !== null;
	}

	/**
	 * Checks if the given key path exists.
	 *
	 * _For async method, use_ [`has()`].
	 *
	 * @param keyPath The key path to check.
	 * @returns `true` if the `keyPath` exists, else `false`.
	 * @example
	 *
	 * Check if the value at `color.name` exists.
	 * ```ts
	 * // Given:
	 * {
	 * 	"color": {
	 *		"name": "cerulean",
	 *		"code": {
	 *			"rgb": [0, 179, 230],
	 *			"hex": "#003BE6"
	 *		}
	 *	}
	 * }
	 *
	 * const exists = cache.hasSync('color.name');
	 * // => true
	 * ```
	 * @example
	 *
	 * Check if the value at `color.hue` exists.
	 * ```ts
	 * const exists = cache.hasSync(['color', 'hue']);
	 * // => false
	 * ```
	 * @example
	 *
	 * Check if the value at `color.code.rgb[1]` exists.
	 * ```ts
	 * const exists = cache.hasSync(color.code.rgb[1]);
	 * // => true
	 * ```
	 *
	 * @category Has Methods
	 */
	hasSync(keyPath: KeyPath): boolean {
		if (keyPath === undefined || keyPath === null) {
			throw new Error("KeyPath cannot be undefined or null.");
		}

		const key = this.createKey(keyPath);

		if (key === keyPath.toString()) {
			return this.storageBase.hasSync(key);
		}

		const data = this.getSync(keyPath);
		return data !== undefined && data?.value !== null;
		// return data !== undefined && data?.value !== null;
		// return _has(data?.value, keyPath);
	}

	/**
	 * Unsets all key values.
	 *
	 * _For sync method, use_ [`unsetSync()`].
	 *
	 * @returns A promise which resolves when the key values have been unset.
	 * @example
	 *
	 * Unsets all key values.
	 * ```ts
	 * await cache.unset();
	 * await cache.getAll();
	 * // => undefined
	 * ```
	 *
	 * @category Unset Methods
	 */
	unset(): Promise<boolean>;

	/**
	 * Unsets the property at the given key path.
	 *
	 * _For sync method, use_ [`unsetSync()`].
	 *
	 * @param keyPath The key path of the property.
	 * @returns A promise which resolves when the setting has been unset.
	 * @example
	 *
	 * Unset the property `color.name`.
	 * ```ts
	 * // Given:
	 * {
	 * 	"color": {
	 *		"name": "cerulean",
	 *		"code": {
	 *			"rgb": [0, 179, 230],
	 *			"hex": "#003BE6"
	 *		}
	 *	}
	 * }
	 *
	 * await cache.unset('color.name');
	 * await cache.get('color.name');
	 * // => undefined
	 * ```
	 * @example
	 *
	 * Unset the property `color.code.rgba[1]`.
	 * ```ts
	 * await cache.unset('color.code.rgba[1]');
	 * await cache.get('color.code.rgb');
	 * // => [0, null, 230]
	 * ```
	 *
	 * @category Unset Methods
	 */
	async unset(keyPath: KeyPath): Promise<boolean>;

	async unset(keyPath?: KeyPath): Promise<boolean> {
		if (this.storageBase.length === 0) return false;

		if (keyPath) {
			const key = this.createKey(keyPath);
			const data = await this.storageBase.get(key);

			if (data) {
				if (_unset(data.value, keyPath)) {
					if (Object.keys(data.value || {}).length > 0) {
						//update
						await this.storageBase.set(key, data);
						return true;
					}
				}

				return this.storageBase.unset(key);
			}
			return false;
		}

		return this.storageBase.unset();
	}

	/**
	 * Unsets all key values.
	 *
	 * _For async method, use_ [`unset()`].
	 *
	 * @example
	 *
	 * Unsets all key values.
	 * ```ts
	 * cache.unsetSync();
	 * ```
	 *
	 * @category Unset Methods
	 */
	unsetSync(): boolean;

	/**
	 * Unsets the property at the given key path.
	 *
	 * _For async method, use_ [`unset()`].
	 *
	 * @param keyPath The key path of the property.
	 * @example
	 *
	 * Unset the property `color.name`.
	 * ```ts
	 * // Given:
	 * {
	 * 	"color": {
	 *		"name": "cerulean",
	 *		"code": {
	 *			"rgb": [0, 179, 230],
	 *			"hex": "#003BE6"
	 *		}
	 *	}
	 * }
	 *
	 * cache.unsetSync('color.name');
	 * cache.getSync('color.name');
	 * // => undefined
	 * ```
	 * @example
	 *
	 * Unset the property `color.code.rgba[1]`.
	 * ```ts
	 * cache.unsetSync('color.code.rgba[1]');
	 * cache.getSync('color.code.rgb');
	 * // => [0, null, 230]
	 * ```
	 *
	 * @category Unset Methods
	 */
	unsetSync(keyPath: KeyPath): boolean;

	unsetSync(keyPath?: KeyPath): boolean {
		if (this.storageBase.length === 0) return false;

		if (keyPath) {
			const key = this.createKey(keyPath);
			const data = this.storageBase.getSync(key);

			if (data) {
				if (_unset(data.value, keyPath)) {
					if (Object.keys(data.value || {}).length > 0) {
						//update
						this.storageBase.setSync(key, data);
						return true;
					}
				}

				return this.storageBase.unsetSync(key);
			}
			return false;
		}

		return this.storageBase.unsetSync();
	}

	/**
	 * Resets the storage with the provided key-value pairs and optional TTL.
	 *
	 * This method first clears all existing entries in the storage engine.
	 * It then iterates over the provided key-value pairs, setting each one
	 * in the storage with the specified TTL. If no TTL is provided, the
	 * default TTL from the options is used.
	 *
	 * @template T - The type of values being stored.
	 * @param keyValues - An object containing key-value pairs to be stored.
	 * @param ttl - Optional TTL settings for the stored values. Defaults to
	 *              the instance's configured TTL.
	 * @returns A promise that resolves when all key-value pairs have been
	 *          set in the storage.
	 *
	 * @category Reset Data Methods
	 */
	async resetWith<T extends ValueType>(keyValues: RecordType<T>, ttl: Partial<TTL> = this.options.ttl): Promise<void> {
		await this.storageBase.unset();

		const promises = Object.entries(keyValues).map(([key, value]) => {
			const obj: object = {};

			_set(obj, key, value);
			const dataSet = this.prepareDataSet<T>(obj as T, ttl);

			return this.storageBase.set(this.createKey(key), dataSet.data);
		});

		await Promise.all(promises);
	}

	/**
	 * Resets the storage with the provided key-value pairs and optional TTL.
	 *
	 * This method first clears all existing entries in the storage engine.
	 * It then iterates over the provided key-value pairs, setting each one
	 * in the storage with the specified TTL. If no TTL is provided, the
	 * default TTL from the options is used.
	 *
	 * @template T - The type of values being stored.
	 * @param keyValues - An object containing key-value pairs to be stored.
	 * @param ttl - Optional TTL settings for the stored values. Defaults to
	 *              the instance's configured TTL.
	 *
	 * @category Reset Data Methods
	 */
	resetWithSync<T extends ValueType>(keyValues: RecordType<T>, ttl: Partial<TTL> = this.options.ttl): void {
		this.storageBase.unsetSync();

		Object.entries(keyValues).forEach(([key, value]) => {
			const obj: object = {};

			_set(obj, key, value);
			const dataSet = this.prepareDataSet<T>(obj as T, ttl);

			this.storageBase.setSync(this.createKey(key), dataSet.data);
		});
	}

	/**
	 * Retrieves the number of items currently stored in the cache.
	 *
	 * @returns The count of items in the storage.	 *
	 * @category Auxiliary Methods
	 */
	get length(): number {
		return this.storageBase.length;
	}

	/**
	 * Retrieves the total number of bytes used by the cache in the storage.
	 *
	 * @returns The total bytes used by the cache.
	 * @category Auxiliary Methods
	 */
	get bytes(): number {
		return this.storageBase.bytes;
	}

	/**
	 * Provides information about the current cache.
	 *
	 * @returns An object containing:
	 *  - `dataBase`: The name of the database used by the cache.
	 *  - `size`: The calculated storage size in bytes represented as a string.
	 *  - `options`: The current cache options including TTL converted to milliseconds.
	 *
	 * ```ts
	 * {
	 * 	dataBase: 'myAppCache',
	 * 	size: 'XXb', // e.g., '120b'
	 * 	options: {
	 * 		ttl: 300000, // 5 minutes in ms
	 * 		removeExpired: true,
	 * 		storage: 2 // StorageEngine.IndexedDB
	 * 	}
	 * }
	 * ```
	 *
	 * @category Auxiliary Methods
	 */
	get info(): { dataBase: string; size: string; options: Options } {
		const size = Utils.calculateStorageSize(this.storageBase.bytes);
		return {
			dataBase: this.baseName,
			size,
			options: {
				...this.options,
				ttl: Utils.convertTTLToMilliseconds(this.options.ttl),
			},
		};
	}

	/**
	 * Returns the type of storage engine used by the cache.
	 *
	 * @returns The type of storage engine used by the cache.
	 * @category Auxiliary Methods
	 */
	get storageType(): StorageEngine {
		return this.storageBase.type;
	}
}
