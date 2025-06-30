import type { DataModel, StorageBase, ValueType } from "../models";
import { StorageEngine } from "../models";

export class SessionStorageStrategy implements StorageBase {
	private prefixKey: string;
	private memoryCache: Map<string, DataModel<ValueType>> = new Map();

	constructor(prefixKey = "HybridWebCache") {
		this.prefixKey = `${prefixKey.trim()}::`;
		this.loadMemoryCache(); // Load existing data into memory cache on initialization
	}

	private formattedKey(key: string): string {
		return `${this.prefixKey}${key}`;
	}

	private _forEachStorage(callback: (originalKey: string, value: string | null) => void): void {
		for (let i = 0; i < sessionStorage.length; i++) {
			const key = sessionStorage.key(i);
			if (key?.startsWith(this.prefixKey)) {
				callback(key.replace(this.prefixKey, ""), sessionStorage.getItem(key));
			}
		}
	}

	private loadMemoryCache(): void {
		this.memoryCache.clear(); // Clear existing cache before loading

		this._forEachStorage((key, value) => {
			const data: DataModel<ValueType> = JSON.parse(value ?? "{}");
			this.memoryCache.set(key, data);
		});
	}

	/** @internal */
	async init(): Promise<void> {
		return Promise.resolve();
	}

	set<T extends ValueType>(key: string, data: DataModel<T>): Promise<void> {
		return Promise.resolve(this.setSync(key, data));
	}

	setSync<T extends ValueType>(key: string, data: DataModel<T>): void {
		sessionStorage.setItem(this.formattedKey(key), JSON.stringify(data));
		this.memoryCache.set(key, data);
	}

	get<T extends ValueType>(key: string): Promise<DataModel<T> | undefined> {
		return Promise.resolve(this.getSync(key));
	}

	getSync<T extends ValueType>(key: string): DataModel<T> | undefined {
		return this.memoryCache.get(key) as DataModel<T>;
	}

	getAll<T extends ValueType>(): Promise<Map<string, DataModel<T>> | null> {
		return Promise.resolve(this.getAllSync<T>());
	}

	getAllSync<T extends ValueType>(): Map<string, DataModel<T>> | null {
		return this.memoryCache.size > 0 ? (this.memoryCache as Map<string, DataModel<T>>) : null;
	}

	has(key: string): Promise<boolean> {
		return Promise.resolve(this.hasSync(key));
	}

	hasSync(key: string): boolean {
		return this.memoryCache.has(key);
	}

	unset(key?: string): Promise<boolean> {
		return Promise.resolve(this.unsetSync(key));
	}

	unsetSync(key?: string): boolean {
		if (this.memoryCache.size === 0) return false;

		let result = false;
		if (!key) {
			const keysToRemove: string[] = [];
			this._forEachStorage((originalKey, _value) => keysToRemove.push(originalKey));
			keysToRemove.forEach((k) => sessionStorage.removeItem(k));
			this.memoryCache.clear();
			result = true;
		} else {
			if (this.hasSync(key)) {
				const fKey = this.formattedKey(key);
				sessionStorage.removeItem(fKey);
				result = this.memoryCache.delete(key);
			}
		}
		return result;
	}

	get length(): number {
		return this.memoryCache.size;
	}

	get bytes(): number {
		if (this.memoryCache.size === 0) return 0;

		let totalBytes = 0;
		this._forEachStorage((key, value) => {
			totalBytes += new TextEncoder().encode(key).length;
			if (value) {
				totalBytes += new TextEncoder().encode(value).length;
			}
		});
		return totalBytes;
	}

	get type(): StorageEngine {
		return StorageEngine.SessionStorage;
	}
}
