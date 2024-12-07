import { get as _get, set as _set, has as _has, unset as _unset } from 'lodash';

import StorageBase, { DataGetType, DataSetType, GetOptionsType, KeyPath, KeyValues, OptionsType, SetOptionsType, StorageType, ValueTypes } from './core/models';
import { StorageFactory } from './core/StorageFactory';
import { Utils } from './utils';

const defaultOptions: OptionsType = {
	ttl: { seconds: 0, minutes: 0, hours: 1, days: 0 },
	removeExpired: true
};

export class HybridWebCache {
	private baseName: string;
	private options: OptionsType;
	private storageEngine: StorageBase;

	constructor(baseName: string = 'HybridWebCache', options?: Partial<OptionsType>) {
		this.baseName = baseName;
		this.options = { ...defaultOptions, ...options };

		this.storageEngine = this.determineStorageEngine();
	}

	private determineStorageEngine(): StorageBase {
        return StorageFactory.createStorage(StorageType.Memory);
	}

	private createKey(keyPath: KeyPath): string {
		// return `${this.baseName}:${Utils.getKey(keyPath)}`;
		return Utils.getKey(keyPath);
	}

	private prepareDataSet<T extends ValueTypes>(value: T, options?: Partial<SetOptionsType>) {
		const opts = { ...this.options, ...options };
		const ttlMs = Utils.convertTTLToMilliseconds(opts.ttl);
		const expiresAt = ttlMs > 0 ? Date.now() + ttlMs : 0;

		const data: DataSetType<T> = { value, expiresAt };

		return { data };
	}

	async resetWith<T extends ValueTypes>(keyValues: KeyValues<T>, options?: Partial<SetOptionsType>): Promise<void> {
		await this.storageEngine.unset();

		return new Promise<void>((resolve, _reject) => {
			Object.entries(keyValues).forEach(([key, value]) => {
				let obj: object = {};

				_set(obj, key, value);
				const dataSet = this.prepareDataSet<T>(obj as T, this.options);

				this.storageEngine.set(this.createKey(key), dataSet.data);
			});
			resolve();
		});
	}

	resetWithSync<T extends ValueTypes>(keyValues: KeyValues<T>, options?: Partial<SetOptionsType>): void {
		this.storageEngine.unsetSync();

		Object.entries(keyValues).forEach(([key, value]) => {
			let obj: object = {};

			_set(obj, key, value);
			const dataSet = this.prepareDataSet<T>(obj as T, this.options);

			this.storageEngine.set(this.createKey(key), dataSet.data);
		});
	}

	async set<T extends ValueTypes>(keyPath: KeyPath, value: T, options?: Partial<SetOptionsType>): Promise<void> {
		const key = this.createKey(keyPath);
		const cache = await this.storageEngine.get(key);
		const obj = cache?.value || {};

		_set(obj as object, keyPath, value);
		const dataSet = this.prepareDataSet(obj, options);

		return this.storageEngine.set(key, dataSet.data);
	}

	setSync<T extends ValueTypes>(keyPath: KeyPath, value: T, options?: Partial<SetOptionsType>): void {
		const key = this.createKey(keyPath);
		const cache = this.storageEngine.getSync(key);
		const obj = cache?.value || {};

		_set(obj as object, keyPath, value);

		const dataSet = this.prepareDataSet(obj, options);

		return this.storageEngine.setSync(key, dataSet.data);
	}

	async get<T extends ValueTypes>(keyPath: KeyPath, options?: Partial<GetOptionsType>): Promise<DataGetType<T> | undefined> {
		// const storage = options?.storage || this.options.storage;
		const removeExpired = options?.removeExpired ?? this.options.removeExpired;
		const key = this.createKey(keyPath);
		const cache = await this.storageEngine.get(key);

		if (cache) {
			let value = _get(cache.value, keyPath);

			if (value === undefined) {
				return undefined;
			}

			cache.isExpired = Utils.isExpired(cache.expiresAt);
			if (removeExpired && cache.isExpired) {
				await this.unset(keyPath);
				value = null;
			}

			return {
				value,
				expiresAt: cache.expiresAt,
				isExpired: cache.isExpired,
			} as DataGetType<T>;
		}

		return undefined;
	}

	getSync<T extends ValueTypes>(keyPath: KeyPath, options?: Partial<GetOptionsType>): DataGetType<T> | undefined {
		// const storage = options?.storage || this.options.storage;
		const removeExpired = options?.removeExpired ?? this.options.removeExpired;
		const key = this.createKey(keyPath);
		const cache = this.storageEngine.getSync(key);

		if (cache) {
			let value = _get(cache.value, keyPath);

			if (value === undefined) {
				return;
			}

			cache.isExpired = Utils.isExpired(cache.expiresAt);
			if (removeExpired && cache.isExpired) {
				this.unsetSync(keyPath);
				value = null;
			}

			return {
				value,
				expiresAt: cache.expiresAt,
				isExpired: cache.isExpired,
			} as DataGetType<T>;
		}

		return;
	}

	async getAll(options?: Partial<GetOptionsType>): Promise<Map<string, DataGetType<unknown>> | null> {
		const removeExpired = options?.removeExpired ?? this.options.removeExpired;

		const allItems = await this.storageEngine.getAll();
		if (!allItems) {
			return null;
		}

		const result: Map<string, DataGetType<unknown>> = new Map();

		for (const [key, cache] of allItems) {
			const [iKey, iValue] = Object.entries(cache.value!)[0];

			// Check if the item is expired
			cache.isExpired = Utils.isExpired(cache.expiresAt);

			// If `removeExpired` is true and the item is expired, remove it and skip adding to result
			if (removeExpired && cache.isExpired) {
				await this.unset(iKey);
				continue;
			}

			result.set(iKey, {
				value: iValue,
				expiresAt: cache.expiresAt,
				isExpired: cache.isExpired,
			});
		}

		return Promise.resolve(result);
	}

	getAllSync(options?: Partial<GetOptionsType>): Map<string, DataGetType<unknown>> | null {
		const removeExpired = options?.removeExpired ?? this.options.removeExpired;

		const allItems = this.storageEngine.getAllSync();
		if (!allItems) {
			return null;
		}

		const result: Map<string, DataGetType<unknown>> = new Map();

		for (const [key, cache] of allItems) {
			const [iKey, iValue] = Object.entries(cache.value!)[0];

			// Check if the item is expired
			cache.isExpired = Utils.isExpired(cache.expiresAt);

			// If `removeExpired` is true and the item is expired, remove it and skip adding to result
			if (removeExpired && cache.isExpired) {
				this.unsetSync(iKey);
				continue;
			}

			result.set(iKey, {
				value: iValue,
				expiresAt: cache.expiresAt,
				isExpired: cache.isExpired,
			});
		}

		return result;
	}

	async has(keyPath: KeyPath): Promise<boolean> {
		const data = await this.get(keyPath);
		return data !== undefined && data?.value !== null;
	}
	hasSync(keyPath: KeyPath): boolean {
		const data = this.getSync(keyPath);
		return data !== undefined && data?.value !== null;
	}

	unset(): Promise<boolean>;
	unset(keyPath: KeyPath): Promise<boolean>;
	async unset(keyPath?: KeyPath): Promise<boolean> {
		if (keyPath) {
			const key = this.createKey(keyPath);
			const cache = await this.storageEngine.get(key);

			if (cache) {
				if (_unset(cache.value, keyPath)) {
					if (JSON.stringify(cache.value || '') !== '{}') {
						//update
						return this.storageEngine.set(key, cache).then(() => true);
					}
				}

				return this.storageEngine.unset(key);
			}
			return false;
		}

		return this.storageEngine.unset();
	}

	unsetSync(): boolean;
	unsetSync(keyPath: KeyPath): boolean;
	unsetSync(keyPath?: KeyPath): boolean {
		if (keyPath) {
			const key = this.createKey(keyPath);
			const cache = this.storageEngine.getSync(key);

			if (cache) {
				if (_unset(cache.value, keyPath)) {
					if (JSON.stringify(cache.value || '') !== '{}') {
						//update
						this.storageEngine.setSync(key, cache);
						return true;
					}
				}

				return this.storageEngine.unsetSync(key);
			}
			return false;
		}

		return this.storageEngine.unsetSync();
	}

	async getJson(options?: Partial<GetOptionsType>): Promise<Record<string, unknown> | null> {
		const allValues: Record<string, unknown> = {};
		const allItems = await this.getAll(options);

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
	getJsonSync(options?: Partial<GetOptionsType>): Record<string, unknown> | null {
		const allValues: Record<string, unknown> = {};
		const allItems = this.getAllSync(options);

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

	get lenght(): number {
		return this.storageEngine.length;
	}

	get bytes(): number {
		return this.storageEngine.bytes;
	}

	get info(): { dataBase: string; size: string; options: OptionsType } {
		const size = Utils.calculateStorageSize(this.storageEngine.bytes);
		return {
			dataBase: this.baseName,
			size,
			options: {
				...this.options,
				ttl: Utils.convertTTLToMilliseconds(this.options.ttl),
			},
		};
	}

	get storageType(): StorageType {
		return this.storageEngine.type;
	}
}
