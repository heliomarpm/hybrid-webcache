import { get as _get, set as _set, unset as _unset } from 'lodash';

import { StorageBase, DataGetType, DataSetType, KeyPath, KeyValues, OptionsType, StorageType, TTLType, ValueTypes } from './models';
import { StorageFactory } from './StorageFactory';
import { Utils } from './utils';

const defaultOptions: OptionsType = {
	ttl: { seconds: 0, minutes: 0, hours: 1, days: 0 },
	removeExpired: true,
	storage: StorageType.Auto
};

export class HybridWebCache {
	private baseName: string;
	private options: OptionsType;
	private storageEngine: StorageBase;

	/**
	 * Constructor for  Hybrid WebCache's.
	 * To reset the cache, use [resetWith()|resetWithSync()].
	 *
	 * @param {string} [baseName='HybridWebCache'] - The base name of the cache.
	 * @param {Partial<OptionsType>} [options] - The options for the cache.
	 *
	 * Default Options:
	 * ```js
	 * {
	 *  ttl: { seconds: 0, minutes: 0, hours: 1, days: 0 },
	 * 	removeExpired: true,
	 * 	storage: StorageType.Auto
	 * }
	 * ```
	 */
	constructor(baseName: string = 'HybridWebCache', options?: Partial<OptionsType>) {
		this.baseName = baseName;
		this.options = { ...defaultOptions, ...options };

		this.storageEngine = this.determineStorageEngine(this.options.storage);
		this.options.storage = this.storageEngine.type;
	}

	private determineStorageEngine(storage: StorageType): StorageBase {
		return StorageFactory.createStorage(storage, this.baseName);
	}

	private createKey(keyPath: KeyPath): string {
		return Utils.getKey(keyPath);
	}

	private prepareDataSet<T extends ValueTypes>(value: T, ttl: Partial<TTLType> = this.options.ttl) {
		const ttlMs = Utils.convertTTLToMilliseconds(ttl);
		const expiresAt = ttlMs > 0 ? Date.now() + ttlMs : 0;
		const data: DataSetType<T> = { value, expiresAt };

		return { data };
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
	 */
	async resetWith<T extends ValueTypes>(keyValues: KeyValues<T>, ttl: Partial<TTLType> = this.options.ttl): Promise<void> {
		await this.storageEngine.unset();

		const promises = Object.entries(keyValues).map(([key, value]) => {
			const obj: object = {};

			_set(obj, key, value);
			const dataSet = this.prepareDataSet<T>(obj as T, ttl);

			return this.storageEngine.set(this.createKey(key), dataSet.data);
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
	 */
	resetWithSync<T extends ValueTypes>(keyValues: KeyValues<T>, ttl: Partial<TTLType> = this.options.ttl): void {
		this.storageEngine.unsetSync();

		Object.entries(keyValues).forEach(([key, value]) => {
			const obj: object = {};

			_set(obj, key, value);
			const dataSet = this.prepareDataSet<T>(obj as T, ttl);

			this.storageEngine.set(this.createKey(key), dataSet.data);
		});
	}

	/**
	 * Sets the value for a given keyPath in the storage engine.
	 *
	 * If the keyPath already exists, its value is updated with the provided
	 * value. If the keyPath does not exist, a new entry is created with the
	 * provided TTL.
	 * @category Core
	 * @template T - The type of the value being stored.
	 * @param keyPath - The keyPath to be stored.
	 * @param value - The value to be stored.
	 * @param ttl - Optional TTL settings for the stored value. Defaults to
	 *              the instance's configured TTL.
	 */
	async set<T extends ValueTypes>(keyPath: KeyPath, value: T, ttl: Partial<TTLType> = this.options.ttl): Promise<void> {
		const key = this.createKey(keyPath);
		const data = await this.storageEngine.get(key);
		const obj = data?.value || {};

		_set(obj as object, keyPath, value);
		const dataSet = this.prepareDataSet(obj, ttl);

		return this.storageEngine.set(key, dataSet.data);
	}

	/**
	 * Synchronous version of set.
	 *
	 * @category Core
	 * @template T - The type of the value being stored.
	 * @param keyPath - The keyPath to be stored.
	 * @param value - The value to be stored.
	 * @param ttl - Optional TTL settings for the stored value. Defaults to
	 *              the instance's configured TTL.
	 */
	setSync<T extends ValueTypes>(keyPath: KeyPath, value: T, ttl: Partial<TTLType> = this.options.ttl): void {
		const key = this.createKey(keyPath);
		const data = this.storageEngine.getSync(key);
		const obj = data?.value || {};

		_set(obj as object, keyPath, value);

		const dataSet = this.prepareDataSet(obj, ttl);

		return this.storageEngine.setSync(key, dataSet.data);
	}

	/**
	 * Retrieves the value associated with the specified keyPath from the storage engine.
	 *
	 * If the value is found, it returns an object containing the value, expiration time,
	 * and expiration status. If the value is expired and the `removeExpired` flag is set
	 * to true, the expired value is removed from storage and `undefined` is returned.
	 *
	 * @category Core
	 * @template T - The type of the value being retrieved.
	 * @param keyPath - The path to the key whose value should be retrieved.
	 * @param removeExpired - A flag indicating whether to remove the key if its value
	 *                        is expired. Defaults to the instance's configured setting.
	 * @returns A promise that resolves to an object containing the value and its metadata,
	 *          or `undefined` if the value does not exist or is expired and removed.
	 */
	async get<T extends ValueTypes>(keyPath: KeyPath, removeExpired: boolean = this.options.removeExpired): Promise<DataGetType<T> | undefined> {
		const key = this.createKey(keyPath);
		const data = await this.storageEngine.get(key);

		if (data) {
			const value = _get(data.value, keyPath);

			if (value === undefined) {
				return;
			}

			data.isExpired = Utils.isExpired(data.expiresAt);
			if (removeExpired && data.isExpired) {
				await this.unset(keyPath);
				return;
			}

			return {
				value,
				expiresAt: data.expiresAt,
				isExpired: data.isExpired
			} as DataGetType<T>;
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
	 * @category Core
	 * @template T - The type of the value being retrieved.
	 * @param keyPath - The path to the key whose value should be retrieved.
	 * @param removeExpired - A flag indicating whether to remove the key if its value
	 *                        is expired. Defaults to the instance's configured setting.
	 * @returns An object containing the value and its metadata, or `undefined` if the
	 *          value does not exist or is expired and removed.
	 */
	getSync<T extends ValueTypes>(keyPath: KeyPath, removeExpired: boolean = this.options.removeExpired): DataGetType<T> | undefined {
		const key = this.createKey(keyPath);
		const data = this.storageEngine.getSync(key);

		if (data) {
			const value = _get(data.value, keyPath);

			if (value === undefined) {
				return;
			}

			data.isExpired = Utils.isExpired(data.expiresAt);
			if (removeExpired && data.isExpired) {
				this.unsetSync(keyPath);
				return;
			}

			return {
				value,
				expiresAt: data.expiresAt,
				isExpired: data.isExpired
			} as DataGetType<T>;
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
	 */
	async getAll(removeExpired: boolean = this.options.removeExpired): Promise<Map<string, DataGetType<unknown>> | null> {
		const allItems = await this.storageEngine.getAll();
		if (!allItems) {
			return null;
		}

		const result: Map<string, DataGetType<unknown>> = new Map();

		for (const [_key, data] of allItems) {
			const [iKey, iValue] = Object.entries(data.value!)[0];

			// Check if the item is expired
			data.isExpired = Utils.isExpired(data.expiresAt);

			// If `removeExpired` is true and the item is expired, remove it and skip adding to result
			if (removeExpired && data.isExpired) {
				await this.unset(iKey);
				continue;
			}

			result.set(iKey, {
				value: iValue,
				expiresAt: data.expiresAt,
				isExpired: data.isExpired
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
	 */
	getAllSync(removeExpired: boolean = this.options.removeExpired): Map<string, DataGetType<unknown>> | null {
		const allItems = this.storageEngine.getAllSync();
		if (!allItems) {
			return null;
		}

		const result: Map<string, DataGetType<unknown>> = new Map();

		for (const [_key, data] of allItems) {
			const [iKey, iValue] = Object.entries(data.value!)[0];

			// Check if the item is expired
			data.isExpired = Utils.isExpired(data.expiresAt);

			// If `removeExpired` is true and the item is expired, remove it and skip adding to result
			if (removeExpired && data.isExpired) {
				this.unsetSync(iKey);
				continue;
			}

			result.set(iKey, {
				value: iValue,
				expiresAt: data.expiresAt,
				isExpired: data.isExpired
			});
		}

		return result.size > 0 ? result : null;
	}

	/**
	 * Checks if a value exists for the specified keyPath in the storage engine.
	 *
	 * This method first creates a key from the provided keyPath. If the key matches
	 * the string representation of the keyPath, it directly checks the storage engine
	 * for the presence of the key. Otherwise, it retrieves the data for the keyPath
	 * and determines existence based on the presence of non-null value data.
	 *
	 * @category Core
	 * @param keyPath - The path to the key to check for existence.
	 * @returns A promise that resolves to `true` if the key exists and has a non-null value,
	 *          or `false` otherwise.
	 */
	async has(keyPath: KeyPath): Promise<boolean> {
		const key = this.createKey(keyPath);

		if (key === keyPath.toString()) {
			return this.storageEngine.has(key);
		}

		const data = await this.get(keyPath);
		return data !== undefined && data?.value !== null;
	}

	/**
	 * Synchronously checks if a value exists for the specified keyPath in the storage engine.
	 *
	 * This method creates a key from the provided keyPath. If the key matches
	 * the string representation of the keyPath, it directly checks the storage engine
	 * for the presence of the key using `hasSync`. Otherwise, it retrieves the data for
	 * the keyPath using `getSync` and determines existence based on the presence of non-null
	 * value data.
	 *
	 * @category Core
	 * @param keyPath - The path to the key to check for existence.
	 * @returns `true` if the key exists and has a non-null value, or `false` otherwise.
	 */
	hasSync(keyPath: KeyPath): boolean {
		const key = this.createKey(keyPath);

		if (key === keyPath.toString()) {
			return this.storageEngine.hasSync(key);
		}

		const data = this.getSync(keyPath);
		return data !== undefined && data?.value !== null;
		// return data !== undefined && data?.value !== null;
		// return _has(data?.value, keyPath);
	}

	/**
	 * Unsets all key values. For sync, use [unsetSync()].
	 *
	 * @category Core
	 * @returns A promise which resolves when the key values have
	 * been unset.
	 * @example
	 *
	 * Unsets all key values.
	 *```js
	 *     await cache.unset();
	 * ```
	 */
	unset(): Promise<boolean>;
	/**
	 * Unsets all key values. For sync, use [unsetSync()].
	 *
	 * @category Core
	 * @returns A promise which resolves when the key values have
	 * been unset.
	 * @example
	 *
	 * Unset the property `color.name`.
	 *```js
	 *     // Given:
	 *     //
	 *     // {
	 *     //   "color": {
	 *     //     "name": "cerulean",
	 *     //     "code": {
	 *     //       "rgb": [0, 179, 230],
	 *     //       "hex": "#003BE6"
	 *     //     }
	 *     //   }
	 *     // }
	 *
	 *     await cache.unset('color.name');
	 *
	 *     await cache.get('color.name');
	 *     // => undefined
	 *```
	 * @example
	 *
	 * Unset the property `color.code.rgba[1]`.
	 *```js
	 *     await cache.unset('color.code.rgba[1]');
	 *
	 *     await cache.get('color.code.rgb').value;
	 *     // => [0, null, 230]
	 * ```
	 */
	unset(keyPath: KeyPath): Promise<boolean>;
	async unset(keyPath?: KeyPath): Promise<boolean> {
		if (keyPath) {
			const key = this.createKey(keyPath);
			const data = await this.storageEngine.get(key);

			if (data) {
				if (_unset(data.value, keyPath)) {
					if (Object.keys(data.value || {}).length > 0) {
						//update
						await this.storageEngine.set(key, data);
						return true;
					}
				}

				return this.storageEngine.unset(key);
			}
			return false;
		}

		return this.storageEngine.unset();
	}

	/**
	 * Unsets all key values. For async, use [unset()].
	 *
	 * @category Core
	 * @returns `true` if the key was unset, or `false` otherwise.
	 * @example
	 *
	 * Unsets all key values.
	 *```js
	 *     cache.unsetSync();
	 * ```
	 */
	unsetSync(): boolean;
	/**
	 * Unsets all key values. For sync, use [unsetSync()].
	 *
	 * @category Core
	 * @returns `true` if the key was unset, or `false` otherwise.
	 * @example
	 *
	 * Unset the property `color.name`.
	 *```js
	 *     // Given:
	 *     //
	 *     // {
	 *     //   "color": {
	 *     //     "name": "cerulean",
	 *     //     "code": {
	 *     //       "rgb": [0, 179, 230],
	 *     //       "hex": "#003BE6"
	 *     //     }
	 *     //   }
	 *     // }
	 *
	 *     cache.unsetSync('color.name');
	 *
	 *     cache.getSync('color.name');
	 *     // => undefined
	 *```
	 * @example
	 *
	 * Unset the property `color.code.rgba[1]`.
	 *```js
	 *     cache.unsetSync('color.code.rgba[1]');
	 *
	 *     cache.getSync('color.code.rgb').value;
	 *     // => [0, null, 230]
	 * ```
	 */
	unsetSync(keyPath: KeyPath): boolean;
	unsetSync(keyPath?: KeyPath): boolean {
		if (keyPath) {
			const key = this.createKey(keyPath);
			const data = this.storageEngine.getSync(key);

			if (data) {
				if (_unset(data.value, keyPath)) {
					if (Object.keys(data.value || {}).length > 0) {
						//update
						this.storageEngine.setSync(key, data);
						return true;
					}
				}

				return this.storageEngine.unsetSync(key);
			}
			return false;
		}

		return this.storageEngine.unsetSync();
	}

	/**
	 * Asynchronously retrieves all key-value pairs from the storage as a JSON object.
	 *
	 * If the `removeExpired` flag is set to true, expired values are removed from storage
	 * before being included in the result.
	 *
	 * @category Core
	 * @param removeExpired - A flag indicating whether to remove expired values from storage.
	 *                        Defaults to the instance's configured setting.
	 * @returns A promise that resolves to a JSON object containing all key-value pairs.
	 *          If no items are found or all items are expired and removed, `null` is returned.
	 */
	async getJson(removeExpired: boolean = this.options.removeExpired): Promise<Record<string, any> | null> {
		const allValues: Record<string, any> = {};
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
	 * @category Core
	 * @param removeExpired - A flag indicating whether to remove expired values from storage.
	 *                        Defaults to the instance's configured setting.
	 * @returns A JSON object containing all key-value pairs. If no items are found or all
	 *          items are expired and removed, `null` is returned.
	 */
	getJsonSync(removeExpired: boolean = this.options.removeExpired): Record<string, any> | null {
		const allValues: Record<string, any> = {};
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
	 * Retrieves the number of items currently stored in the cache.
	 *
	 * @returns The count of items in the storage.
	 */
	get length(): number {
		return this.storageEngine.length;
	}

	/**
	 * Retrieves the total number of bytes used by the cache in the storage.
	 *
	 * @returns The total bytes used by the cache.
	 */
	get bytes(): number {
		return this.storageEngine.bytes;
	}

	/**
	 * Provides information about the current cache.
	 *
	 * @returns An object with the following properties:
	 *          - `dataBase`: The name of the database used by the cache.
	 *          - `size`: The total number of bytes used by the cache in the storage.
	 *          - `options`: The options used to create the cache, including the TTL in milliseconds.
	 */
	get info(): { dataBase: string; size: string; options: OptionsType } {
		const size = Utils.calculateStorageSize(this.storageEngine.bytes);
		return {
			dataBase: this.baseName,
			size,
			options: {
				...this.options,
				ttl: Utils.convertTTLToMilliseconds(this.options.ttl)
			}
		};
	}

	/**
	 * Returns the type of storage engine used by the cache.
	 *
	 * @returns The type of storage engine used by the cache.
	 */
	get storageType(): StorageType {
		return this.storageEngine.type;
	}
}
