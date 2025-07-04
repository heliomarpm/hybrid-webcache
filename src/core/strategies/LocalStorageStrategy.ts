import type { DataModel, StorageBase, ValueType } from "../types";
import { StorageEngine } from "../types";

/** @ignore */
export class LocalStorageStrategy implements StorageBase {
	private prefixKey: string;
	private memoryCache: Map<string, DataModel<ValueType>> = new Map();
	private channel: BroadcastChannel;

	constructor(prefixKey = "HybridWebCache") {
		this.prefixKey = `${prefixKey.trim()}::`;

		this.channel = new BroadcastChannel(`${this.prefixKey}`);
		this.channel.onmessage = this.handleSyncEvent.bind(this);

		this.loadMemoryCache(); // Load existing data into memory cache on initialization
	}

	private handleSyncEvent(event: MessageEvent): void {
		// Handle sync events for multi-instance communication
		const action = event.data?.action || "";

		switch (action) {
			case "clear":
				this.memoryCache.clear();
				break;
			case "unset": {
				const { key } = event.data;
				if (key) {
					this.memoryCache.delete(key);
				}
				break;
			}
			case "sync": {
				const { key, value } = event.data;
				this.memoryCache.set(key, value);
				break;
			}
			default:
				break;
		}
	}

	private formattedKey(key: string): string {
		return `${this.prefixKey}${key}`;
	}

	private _forEachStorage(callback: (originalKey: string, value: string | null) => void): void {
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith(this.prefixKey)) {
				callback(key.replace(this.prefixKey, ""), localStorage.getItem(key));
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
		localStorage.setItem(this.formattedKey(key), JSON.stringify(data));
		this.memoryCache.set(key, data);
		this.channel.postMessage({ action: "sync", key, value: data });
	}

	get<T extends ValueType>(key: string): Promise<DataModel<T> | undefined> {
		return Promise.resolve(this.getSync(key));
	}

	getSync<T extends ValueType>(key: string): DataModel<T> | undefined {
		// const item = localStorage.getItem(this.formattedKey(key));
		// return item ? JSON.parse(item) : undefined;
		return this.memoryCache.get(key) as DataModel<T>;
	}

	getAll<T extends ValueType>(): Promise<Map<string, DataModel<T>> | null> {
		return Promise.resolve(this.getAllSync<T>());
	}

	getAllSync<T extends ValueType>(): Map<string, DataModel<T>> | null {
		// const data = new Map();

		// for (let i = 0; i < localStorage.length; i++) {
		// 	const key = localStorage.key(i);
		// 	if (key?.startsWith(this.prefixKey)) {
		// 		const item = localStorage.getItem(key);
		// 		data.set(key.replace(this.prefixKey, ""), item ? JSON.parse(item) : item);
		// 	}
		// }

		// return data.size > 0 ? data : null;
		return this.memoryCache.size > 0 ? (this.memoryCache as Map<string, DataModel<T>>) : null;
	}

	has(key: string): Promise<boolean> {
		return Promise.resolve(this.hasSync(key));
	}

	hasSync(key: string): boolean {
		// return !!localStorage.getItem(this.formattedKey(key));
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
			keysToRemove.forEach((k) => localStorage.removeItem(k));
			this.memoryCache.clear();
			this.channel.postMessage({ action: "clear", key: undefined, value: undefined });
			result = true;
		} else {
			if (this.hasSync(key)) {
				const fKey = this.formattedKey(key);
				localStorage.removeItem(fKey);
				result = this.memoryCache.delete(key);
				this.channel.postMessage({ action: "unset", key, value: undefined });
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
		return StorageEngine.LocalStorage;
	}
}
