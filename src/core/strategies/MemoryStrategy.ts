import type { DataModel, StorageBase, ValueType } from "../types";
import { StorageEngine } from "../types";

/** @ignore */
export class MemoryStrategy implements StorageBase {
	private storage: Map<string, DataModel<ValueType>> = new Map();

	/** @internal */
	async init(): Promise<void> {
		return Promise.resolve();
	}

	set<T extends ValueType>(key: string, data: DataModel<T>): Promise<void> {
		return Promise.resolve(this.setSync(key, data));
	}
	setSync<T extends ValueType>(key: string, data: DataModel<T>): void {
		this.storage.set(key, data);
	}

	get<T extends ValueType>(key: string): Promise<DataModel<T> | undefined> {
		return Promise.resolve(this.getSync(key));
	}
	getSync<T extends ValueType>(key: string): DataModel<T> | undefined {
		return this.storage.get(key) as DataModel<T> | undefined;
	}

	getAll<T extends ValueType>(): Promise<Map<string, DataModel<T>> | null> {
		return Promise.resolve(this.getAllSync<T>());
	}
	getAllSync<T extends ValueType>(): Map<string, DataModel<T>> | null {
		return this.storage.size > 0 ? (this.storage as Map<string, DataModel<T>>) : null;
	}

	has(key: string): Promise<boolean> {
		return Promise.resolve(this.hasSync(key));
	}
	hasSync(key: string): boolean {
		return this.storage.has(key);
	}

	unset(key?: string): Promise<boolean> {
		return Promise.resolve(this.unsetSync(key));
	}

	unsetSync(key?: string): boolean {
		if (this.storage.size === 0) return false;

		if (!key) {
			this.storage.clear();
			return this.storage.size === 0;
		}
		return this.storage.delete(key);
	}

	get length(): number {
		return this.storage.size;
	}

	get bytes(): number {
		if (this.storage.size === 0) return 0;

		let totalBytes = 0;

		this.storage.entries().forEach(([key, value]) => {
			totalBytes += new TextEncoder().encode(key).length;
			totalBytes += new TextEncoder().encode(JSON.stringify(value)).length;
		});
		return totalBytes;
	}

	get type(): StorageEngine {
		return StorageEngine.Memory;
	}
}
