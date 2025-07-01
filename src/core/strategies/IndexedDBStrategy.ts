import type { DataModel, StorageBase, ValueType } from "../models";
import { StorageEngine } from "../models";

export class IndexedDBStrategy implements StorageBase {
	private db: IDBDatabase | null = null;
	private memoryCache: Map<string, DataModel<ValueType>> = new Map();

	private baseName: string;
	private storeName: string;

	private channel: BroadcastChannel;
	private dbPromise: Promise<IDBDatabase> | null = null; // Melhoria 2: Para gerenciar a promessa de abertura do DB

	constructor(baseName = "HybridWebCache", storeName?: string) {
		this.baseName = baseName.trim().length === 0 ? "HybridWebCache" : baseName.trim();
		this.storeName = storeName?.trim() ?? this.baseName;

		this.channel = new BroadcastChannel(`${this.baseName}.${this.storeName}`);
		this.channel.onmessage = this.handleSyncEvent.bind(this);
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

	private async openDB(): Promise<IDBDatabase> {
		if (this.db) return this.db;
		if (this.dbPromise) return this.dbPromise; // em processo de abertura

		this.dbPromise = new Promise((resolve, reject) => {
			const request = indexedDB.open(this.baseName, 1);

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains(this.storeName)) {
					db.createObjectStore(this.storeName, { keyPath: "key" });
				}
			};

			// request.onsuccess = () => resolve(request.result);
			// request.onerror = () => reject(request.error);

			request.onsuccess = (event) => {
				this.db = (event.target as IDBOpenDBRequest).result;
				this.dbPromise = null; // Clean up the promise after success
				resolve(this.db);
			};

			request.onerror = (event) => {
				console.error(`Failed to open IndexedDB: ${(event.target as IDBOpenDBRequest).error}`);
				this.dbPromise = null; // Clean up the promise after success
				reject((event.target as IDBOpenDBRequest).error);
			};
		});

		return this.dbPromise;
	}

	private async execute<T>(transactionMode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest): Promise<T> {
		if (!this.db) await this.openDB();
		if (!this.db) throw new Error("Database not initialized");

		const transaction = this.db.transaction(this.storeName, transactionMode);
		const store = transaction.objectStore(this.storeName);
		const request = operation(store);

		return new Promise((resolve, reject) => {
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
			transaction.onabort = () => reject(transaction.error || new Error("Transaction aborted"));
			// transaction.oncomplete = () => console.log("Transaction complete success");
		});
	}

	/** @internal */
	async init(): Promise<void> {
		await this.openDB();
		if (!this.db) throw new Error("IndexedDB not open, cannot load memory cache.");

		await this.getAll(); // Load existing data into memory cache
	}

	async set<T extends ValueType>(key: string, data: DataModel<T>): Promise<void> {
		await this.execute("readwrite", (store) => store.put({ key, ...data }));

		this.memoryCache.set(key, data);
		this.channel.postMessage({ action: "sync", key, value: data });
	}

	setSync<T extends ValueType>(key: string, data: DataModel<T>): void {
		this.memoryCache.set(key, data);
		this.channel.postMessage({ action: "sync", key, value: data });

		// this.executeQueue("readwrite", (store) => store.put({ key, ...data }));
		this.execute("readwrite", (store) => store.put({ key, ...data }));
	}

	async get<T extends ValueType>(key: string): Promise<DataModel<T> | undefined> {
		if (this.memoryCache.has(key)) {
			return this.memoryCache.get(key) as DataModel<T>;
		}

		const data = await this.execute<DataModel<T>>("readonly", (store) => store.get(key));
		if (data) {
			this.memoryCache.set(key, data);
			return data;
		}

		return undefined;
	}

	getSync<T extends ValueType>(key: string): DataModel<T> | undefined {
		return this.memoryCache.has(key) ? (this.memoryCache.get(key) as DataModel<T>) : undefined;
	}

	async getAll<T extends ValueType>(): Promise<Map<string, DataModel<T>> | null> {
		await this.openDB(); // Garante que o DB esteja aberto
		if (!this.db) throw new Error("Database not initialized"); // Deve ser inatingível se openDB resolver

		return new Promise((resolve, reject) => {
			const result = new Map<string, DataModel<T>>();
			const transaction = this.db!.transaction(this.storeName, "readonly");
			const store = transaction.objectStore(this.storeName);
			const request = store.openCursor();

			request.onsuccess = (event) => {
				const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
				if (cursor) {
					const storedData = cursor.value;
					result.set(cursor.key as string, storedData);
					cursor.continue();
				} else {
					// Cursor finished, now update memoryCache and resolve
					this.memoryCache.clear();
					result.forEach((value, key) => this.memoryCache.set(key, value));
					resolve(result.size > 0 ? result : null);
				}
			};

			request.onerror = () => reject(request.error);
			transaction.onabort = () => reject(transaction.error || new Error("Transaction aborted"));
		});
	}

	getAllSync<T extends ValueType>(): Map<string, DataModel<T>> | null {
		return this.memoryCache.size > 0 ? (this.memoryCache as Map<string, DataModel<T>>) : null;
	}

	async has(key: string): Promise<boolean> {
		if (this.memoryCache.has(key)) {
			return true;
		}
		const value = await this.get(key);
		return value !== undefined;
	}
	hasSync(key: string): boolean {
		return this.memoryCache.has(key);
	}

	async unset(key?: string): Promise<boolean> {
		if (this.memoryCache.size === 0) return false;

		if (key && this.memoryCache.delete(key)) {
			this.channel.postMessage({ action: "unset", key, value: undefined }); // Notify other instances to remove key
			await this.execute("readwrite", (store) => store.delete(key));

			return true;
		}

		this.memoryCache.clear();
		this.channel.postMessage({ action: "clear", key: undefined, value: undefined }); // Notify other instances to clear keys
		await this.execute("readwrite", (store) => store.clear());

		return true;
	}

	unsetSync(key?: string): boolean {
		if (this.memoryCache.size === 0) return false;

		if (key) {
			if (this.memoryCache.delete(key)) {
				this.channel.postMessage({ action: "unset", key, value: undefined });
				// this.executeQueue("readwrite", (store) => store.delete(key));
				this.execute("readwrite", (store) => store.delete(key));
				return true;
			}
			return false;
		}

		this.memoryCache.clear();
		this.channel.postMessage({ action: "clear", key: undefined, value: undefined });
		// this.executeQueue("readwrite", (store) => store.clear());
		this.execute("readwrite", (store) => store.clear());

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

	get type(): StorageEngine {
		return StorageEngine.IndexedDB;
	}
}
