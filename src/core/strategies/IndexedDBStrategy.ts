import { StorageBase, DataGetType, DataSetType, StorageType, ValueTypes } from '../models';

export class IndexedDBStrategy implements StorageBase {
	private db: IDBDatabase | null = null;
	private memoryCache: Map<string, any> = new Map();
	private queue: Array<() => void> = [];
	private isProcessingQueue: boolean = false;

	private baseName: string;
	private storeName: string;

	private channel: BroadcastChannel;

	constructor(baseName: string = 'HybridWebCache', storeName?: string) {
		this.baseName = baseName.trim().length === 0 ? 'HybridWebCache' : baseName.trim();
		this.storeName = storeName?.trim() ?? this.baseName;

		this.channel = new BroadcastChannel(this.storeName);
		this.channel.onmessage = this.handleSyncEvent.bind(this);

		this.loadMemoryFromIndexedDB();
	}

	private handleSyncEvent(event: MessageEvent): void {
		// Handle sync events for multi-instance communication
		if (event.data?.action === 'sync') {
			const { key, value } = event.data;
			if (value === null) {
				this.memoryCache.delete(key);
			} else {
				this.memoryCache.set(key, value);
			}
		}
	}

	private async loadMemoryFromIndexedDB(): Promise<void> {
		await this.openDB().then(db => {
			const transaction = db.transaction(this.storeName, 'readonly');
			const store = transaction.objectStore(this.storeName);

			store.getAll().onsuccess = event => {
				const data = (event.target as IDBRequest).result;
				for (let i = 0; i < data.length; i++) {
					this.memoryCache.set(data[i].id, data[i]);
				}
			};

			// store.openCursor().onsuccess = (event) => {
			// 	const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
			// 	if (cursor) {
			// 		this.memoryCache.set(cursor.key as string, cursor.value);
			// 		cursor.continue();
			// 	}
			// };
		});
	}

	private async openDB(): Promise<IDBDatabase> {
		if (this.db) return this.db;

		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.baseName, 1);

			request.onupgradeneeded = event => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains(this.storeName)) {
					db.createObjectStore(this.storeName, { keyPath: 'id' });
				}
			};

			request.onsuccess = event => {
				this.db = (event.target as IDBOpenDBRequest).result;
				resolve(this.db);
			};

			// request.onerror = (event)=> reject(event);
			request.onerror = () => {
				console.error('Failed to open IndexedDB:', request.error);
				reject(request.error);
			};
		});
	}

	private async execute(transactionMode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest): Promise<any> {
		if (!this.db) await this.openDB();

		const transaction = this.db!.transaction(this.storeName, transactionMode);
		const store = transaction.objectStore(this.storeName);
		const request = operation(store);

		return new Promise((resolve, reject) => {
			request.onsuccess = () => {
				resolve(transactionMode === 'readonly' ? request.result : undefined);
			};
			request.onerror = () => reject(request.error);
		});
	}

	private executeQueue(transactionMode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest): any {
		const request = indexedDB.open(this.baseName, 1);

		request.onsuccess = () => {
			const db = request.result;
			const transaction = db.transaction(this.storeName, transactionMode);
			const store = transaction.objectStore(this.storeName);
			return operation(store);
		};
	}

	private logPerformance(methodName: string, start: number) {
		console.log(`[Performance] ${methodName} executed in ${Date.now() - start}ms`);
	}

	async set<T extends ValueTypes>(key: string, data: DataSetType<T>): Promise<void> {
		const start = Date.now();

		this.memoryCache.set(key, data);
		this.channel.postMessage({ action: 'sync', key, value: data });

		await this.execute('readwrite', store => store.put({ id: key, ...data }));

		this.logPerformance('set', start);
	}

	setSync<T extends ValueTypes>(key: string, data: DataSetType<T>): void {
		this.memoryCache.set(key, data);
		this.channel.postMessage({ action: 'sync', key, value: data });

		this.executeQueue('readwrite', store => store.put({ id: key, ...data }));
	}

	async get<T extends ValueTypes>(key: string): Promise<DataGetType<T> | undefined> {
		if (this.memoryCache.has(key)) {
			return this.memoryCache.get(key);
		}

		const start = Date.now();
		const data = await this.execute('readonly', store => store.get(key));
		if (data) {
			this.memoryCache.set(key, data); // Atualiza a memória
		}
		this.logPerformance('get', start);

		return data;
	}

	getSync<T extends ValueTypes>(key: string): DataGetType<T> | undefined {
		return this.memoryCache.get(key);
	}

	async getAll(): Promise<Map<string, DataGetType<unknown>> | null> {
		const result = new Map<string, DataGetType<unknown>>();
		await this.execute('readonly', store => {
			const request = store.openCursor();
			request.onsuccess = event => {
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

	getAllSync(): Map<string, DataGetType<unknown>> | null {
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
	unset(): Promise<boolean>;
	unset(key: string): Promise<boolean>;
	unset(key?: string): Promise<boolean> {
		if (key) {
			this.memoryCache.delete(key);
			return this.execute('readwrite', store => store.delete(key));
		}

		this.memoryCache.clear();
		return this.execute('readwrite', store => store.clear());
	}

	unsetSync(): boolean;
	unsetSync(key: string): boolean;
	unsetSync(key?: string): boolean {
		if (key) {
			this.memoryCache.delete(key);

			this.channel.postMessage({ action: 'sync', key, value: null });
			this.executeQueue('readwrite', store => store.delete(key));

			return true;
		}

		this.memoryCache.clear();

		this.channel.postMessage({ action: 'sync', key, value: null });
		this.executeQueue('readwrite', store => store.clear());

		return true;
	}

	get length(): number {
		return this.memoryCache.size;
	}

	get bytes(): number {
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
