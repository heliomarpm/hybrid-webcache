import type { DataGetType, DataSetType, StorageBase, ValueTypes } from "../models";
import { StorageType } from "../models";

export class IndexedDBStrategy implements StorageBase {
	private db: IDBDatabase | null = null;
	private memoryCache: Map<string, DataSetType<ValueTypes> | DataGetType<ValueTypes>> = new Map();

	private baseName: string;
	private storeName: string;

	private channel: BroadcastChannel;

	constructor(baseName = "HybridWebCache", storeName?: string) {
		this.baseName = baseName.trim().length === 0 ? "HybridWebCache" : baseName.trim();
		this.storeName = storeName?.trim() ?? this.baseName;

		this.channel = new BroadcastChannel(this.storeName);
		this.channel.onmessage = this.handleSyncEvent.bind(this);

		this.init();
	}

	private async init() {
		await this.loadMemoryFromIndexedDB();
	}

	private handleSyncEvent(event: MessageEvent): void {
		// Handle sync events for multi-instance communication
		if (event.data?.action === "sync") {
			const { key, value } = event.data;
			if (value === null) {
				this.memoryCache.delete(key);
			} else {
				this.memoryCache.set(key, value);
			}
		}
	}

	private async loadMemoryFromIndexedDB() {
		await this.openDB();

		if (!this.db) return;

		const transaction = this.db.transaction(this.storeName, "readonly");
		const store = transaction.objectStore(this.storeName);

		store.getAll().onsuccess = (event) => {
			const data = (event.target as IDBRequest).result;
			for (let i = 0; i < data.length; i++) {
				this.memoryCache.set(data[i].key, data[i]);
			}
		};

		// store.openCursor().onsuccess = (event) => {
		// 	const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
		// 	if (cursor) {
		// 		this.memoryCache.set(cursor.key as string, cursor.value);
		// 		cursor.continue();
		// 	}
		// };
	}

	private async openDB(): Promise<IDBDatabase> {
		if (this.db) return this.db;

		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.baseName, 1);

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains(this.storeName)) {
					db.createObjectStore(this.storeName, { keyPath: "key" });
				}
			};

			// request.onsuccess = () => resolve(request.result);
			// request.onerror = (event) => reject(event);

			request.onsuccess = (event) => {
				this.db = (event.target as IDBOpenDBRequest).result;
				resolve(this.db);
			};

			request.onerror = (event) => {
				// console.error(`Failed to open IndexedDB: ${(event.target as IDBOpenDBRequest).error}`);
				reject((event.target as IDBOpenDBRequest).error);
			};
		});
	}

	private async execute<T extends ValueTypes>(transactionMode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest): Promise<T> {
		if (!this.db) await this.openDB();
		if (!this.db) throw new Error("Database not initialized");

		const transaction = this.db.transaction(this.storeName, transactionMode);
		const store = transaction.objectStore(this.storeName);
		const request = operation(store);

		return new Promise<T>((resolve, reject) => {
			request.onsuccess = () => {
				resolve(transactionMode === "readonly" ? request.result : undefined);
			};
			request.onerror = () => reject(request.error);
		});
	}

	private executeQueue(transactionMode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest) {
		const request = indexedDB.open(this.baseName, 1);

		request.onsuccess = () => {
			const db = request.result;
			const transaction = db.transaction(this.storeName, transactionMode);
			const store = transaction.objectStore(this.storeName);

			return operation(store);
		};

		request.onerror = (event) => {
			// console.error(`Failed to execute queue operation: ${(event.target as IDBOpenDBRequest).error}`);
			throw new Error(`Failed to execute queue operation: ${(event.target as IDBOpenDBRequest).error}`);
		};
	}

	async set<T extends ValueTypes>(key: string, data: DataSetType<T>): Promise<void> {
		await this.execute("readwrite", (store) => store.put({ key, ...data }));
		this.memoryCache.set(key, data);
		this.channel.postMessage({ action: "sync", key, value: data });
	}

	setSync<T extends ValueTypes>(key: string, data: DataSetType<T>): void {
		this.memoryCache.set(key, data);
		this.channel.postMessage({ action: "sync", key, value: data });

		this.executeQueue("readwrite", (store) => store.put({ key, ...data }));
	}

	async get<T extends ValueTypes>(key: string): Promise<DataGetType<T> | undefined> {
		if (this.memoryCache.has(key)) {
			return this.memoryCache.get(key) as DataGetType<T>;
		}

		const data = await this.execute("readonly", (store) => store.get(key));
		if (data) {
			this.memoryCache.set(key, data as DataSetType<T>); // Atualiza a memória
		}

		return data as DataGetType<T>;
	}

	getSync<T extends ValueTypes>(key: string): DataGetType<T> | undefined {
		if (this.memoryCache.has(key)) {
			return this.memoryCache.get(key);
		}
	}

	async getAll<T extends ValueTypes>(): Promise<Map<string, DataGetType<T>> | null> {
		const result = new Map<string, DataGetType<T>>();
		await this.execute("readonly", (store) => {
			const request = store.openCursor();
			request.onsuccess = (event) => {
				const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
				if (cursor) {
					result.set(cursor.key as string, cursor.value);
					cursor.continue();
				}
			};
			return request;
		});
		return result.size > 0 ? result : null;
	}

	getAllSync<T extends ValueTypes>(): Map<string, DataGetType<T>> | null {
		return this.memoryCache.size > 0 ? new Map(this.memoryCache) : null;
	}
	async has(key: string): Promise<boolean> {
		if (this.memoryCache.has(key)) {
			return this.memoryCache.get(key);
		}
		const value = await this.get(key);
		return value !== undefined;
	}
	hasSync(key: string): boolean {
		return this.memoryCache.has(key);
	}

	unset(key?: string): Promise<boolean> {
		if (key) {
			this.memoryCache.delete(key);
			return this.execute("readwrite", (store) => store.delete(key));
		}

		this.memoryCache.clear();
		return this.execute("readwrite", (store) => store.clear());
	}

	unsetSync(key?: string): boolean {
		if (this.memoryCache.size === 0) return false;

		if (key) {
			if (this.memoryCache.delete(key)) {
				this.channel.postMessage({ action: "sync", key, value: null });
				this.executeQueue("readwrite", (store) => store.delete(key));
				return true;
			}
		}

		this.memoryCache.clear();

		this.channel.postMessage({ action: "sync", key, value: null });
		this.executeQueue("readwrite", (store) => store.clear());
		return true;
	}

	get length(): number {
		return this.memoryCache.size;
	}

	get bytes(): number {
		if (this.memoryCache.size === 0) return 0;

		// return [...this.memoryCache.values()].reduce((acc, value) => acc + JSON.stringify(value).length, 0);

		let totalSize = 0;
		for (const [key, value] of this.memoryCache.entries()) {
			totalSize += new TextEncoder().encode(key).length;
			totalSize += new TextEncoder().encode(JSON.stringify(value)).length;
		}
		return totalSize;
	}

	get type(): StorageType {
		return StorageType.IndexedDB;
	}
}
