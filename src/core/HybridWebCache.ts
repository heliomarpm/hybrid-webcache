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

	constructor(baseName: string = 'HybridWebCache', options?: Partial<OptionsType>) {
		this.baseName = baseName;
		this.options = { ...defaultOptions, ...options };

		this.storageEngine = this.determineStorageEngine(this.options.storage);
		this.options.storage = this.storageEngine.type;
	}

	private determineStorageEngine(storage: StorageType): StorageBase {
		if (storage === StorageType.Auto) {
			if (Utils.isLocalStorageAvailable()) {
				return StorageFactory.createStorage(StorageType.LocalStorage, this.baseName);
			} else if (Utils.isIndexedDBAvailable()) {
				return StorageFactory.createStorage(StorageType.IndexedDB, this.baseName);
			} else {
				return StorageFactory.createStorage(StorageType.Memory, this.baseName);
			}
		}

		return StorageFactory.createStorage(storage, this.baseName);
	}

	private createKey(keyPath: KeyPath): string {
		// return `${this.baseName}:${Utils.getKey(keyPath)}`;
		return Utils.getKey(keyPath);
	}

	private prepareDataSet<T extends ValueTypes>(value: T, ttl: Partial<TTLType> = this.options.ttl) {
		const ttlMs = Utils.convertTTLToMilliseconds(ttl);
		const expiresAt = ttlMs > 0 ? Date.now() + ttlMs : 0;
		const data: DataSetType<T> = { value, expiresAt };

		return { data };
	}

	async resetWith<T extends ValueTypes>(keyValues: KeyValues<T>, ttl: Partial<TTLType> = this.options.ttl): Promise<void> {
		await this.storageEngine.unset();

		return new Promise<void>((resolve, _reject) => {
			Object.entries(keyValues).forEach(([key, value]) => {
				const obj: object = {};

				_set(obj, key, value);
				const dataSet = this.prepareDataSet<T>(obj as T, ttl);

				this.storageEngine.set(this.createKey(key), dataSet.data);
			});
			resolve();
		});
	}

	resetWithSync<T extends ValueTypes>(keyValues: KeyValues<T>, ttl: Partial<TTLType> = this.options.ttl): void {
		this.storageEngine.unsetSync();

		Object.entries(keyValues).forEach(([key, value]) => {
			const obj: object = {};

			_set(obj, key, value);
			const dataSet = this.prepareDataSet<T>(obj as T, ttl);

			this.storageEngine.set(this.createKey(key), dataSet.data);
		});
	}

	async set<T extends ValueTypes>(keyPath: KeyPath, value: T, ttl: Partial<TTLType> = this.options.ttl): Promise<void> {
		const key = this.createKey(keyPath);
		const data = await this.storageEngine.get(key);
		const obj = data?.value || {};

		_set(obj as object, keyPath, value);
		const dataSet = this.prepareDataSet(obj, ttl);

		return this.storageEngine.set(key, dataSet.data);
	}

	setSync<T extends ValueTypes>(keyPath: KeyPath, value: T, ttl: Partial<TTLType> = this.options.ttl): void {
		const key = this.createKey(keyPath);
		const data = this.storageEngine.getSync(key);
		const obj = data?.value || {};

		_set(obj as object, keyPath, value);

		const dataSet = this.prepareDataSet(obj, ttl);

		return this.storageEngine.setSync(key, dataSet.data);
	}

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

	async has(keyPath: KeyPath): Promise<boolean> {
		const key = this.createKey(keyPath);

		if (key === keyPath.toString()) {
			return this.storageEngine.has(key);
		}

		const data = await this.get(keyPath);
		return data !== undefined && data?.value !== null;
	}
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

	unset(): Promise<boolean>;
	unset(keyPath: KeyPath): Promise<boolean>;
	async unset(keyPath?: KeyPath): Promise<boolean> {
		if (keyPath) {
			const key = this.createKey(keyPath);
			const data = await this.storageEngine.get(key);

			if (data) {
				if (_unset(data.value, keyPath)) {
					if (JSON.stringify(data.value || '') !== '{}') {
						//update
						return this.storageEngine.set(key, data).then(() => true);
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
			const data = this.storageEngine.getSync(key);

			if (data) {
				if (_unset(data.value, keyPath)) {
					if (JSON.stringify(data.value || '') !== '{}') {
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
				ttl: Utils.convertTTLToMilliseconds(this.options.ttl)
			}
		};
	}

	get storageType(): StorageType {
		return this.storageEngine.type;
	}
}
