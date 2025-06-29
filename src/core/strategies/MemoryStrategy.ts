import type { DataGet, DataSet, StorageBase, ValueType } from "../models";
import { StorageType } from "../models";

export class MemoryStrategy implements StorageBase {
	private storage: Map<string, DataSet<ValueType> | DataGet<ValueType>> = new Map();

	set<T extends ValueType>(key: string, data: DataSet<T>): Promise<void> {
		return Promise.resolve(this.setSync(key, data));
	}
	setSync<T extends ValueType>(key: string, data: DataSet<T>): void {
		this.storage.set(key, data);
	}

	get<T extends ValueType>(key: string): Promise<DataGet<T> | undefined> {
		return Promise.resolve(this.getSync(key));
	}
	getSync<T extends ValueType>(key: string): DataGet<T> | undefined {
		return this.storage.get(key) as DataGet<T> | undefined;
	}

	getAll<T extends ValueType>(): Promise<Map<string, DataGet<T>> | null> {
		return Promise.resolve(this.getAllSync<T>());
	}
	getAllSync<T extends ValueType>(): Map<string, DataGet<T>> | null {
		return this.storage.size > 0 ? (this.storage as Map<string, DataGet<T>>) : null;
	}

	has(key: string): Promise<boolean> {
		return Promise.resolve(this.hasSync(key));
	}
	hasSync(key: string): boolean {
		return this.storage.has(key);
	}

	unset(key?: string): Promise<boolean> {
		return Promise.resolve(!key ? this.unsetSync() : this.unsetSync(key));
	}

	unsetSync(key?: string): boolean {
		if (this.storage.size === 0) return false;

		if (!key) {
			if (this.storage.size > 0) {
				this.storage.clear();
			}
			return this.storage.size === 0;
		}
		return this.storage.delete(key);
	}

	get length(): number {
		return this.storage.size;
	}

	get bytes(): number {
		if (this.storage.size === 0) return 0;
		// const obj = Object.fromEntries(this.storage);
		// const jsonString = JSON.stringify(obj);
		// return new TextEncoder().encode(jsonString).length;
		let totalBytes = 0;
		for (const [key, value] of this.storage) {
			// totalBytes += new Blob([key]).size;
			// totalBytes += new Blob([JSON.stringify(value)]).size;
			totalBytes += new TextEncoder().encode(key).length;
			totalBytes += new TextEncoder().encode(JSON.stringify(value)).length;
		}
		return totalBytes;
	}

	get type(): StorageType {
		return StorageType.Memory;
	}
}
