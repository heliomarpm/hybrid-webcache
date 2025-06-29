import { StorageBase, DataGetType, DataSetType, StorageType, ValueTypes } from "../models";

export class MemoryStrategy implements StorageBase {
	private storage: Map<string, any> = new Map();

	set<T extends ValueTypes>(key: string, data: DataSetType<T>): Promise<void> {
		return Promise.resolve(this.setSync(key, data));
	}
	setSync<T extends ValueTypes>(key: string, data: DataSetType<T>): void {
		this.storage.set(key, data);
	}

	get<T extends ValueTypes>(key: string): Promise<DataGetType<T> | undefined> {
		return Promise.resolve(this.getSync(key));
	}
	getSync<T extends ValueTypes>(key: string): DataGetType<T> | undefined {
		return this.storage.get(key);
	}

	getAll<T extends ValueTypes>(): Promise<Map<string, DataGetType<T>> | null> {
		return Promise.resolve(this.getAllSync<T>());
	}
	getAllSync<T extends ValueTypes>(): Map<string, DataGetType<T>> | null {
		return this.storage.size > 0 ? (this.storage as Map<string, DataGetType<T>>) : null;
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
		if (!key) {
			if (this.storage.size > 0) {
				this.storage.clear();
			}
			return this.storage.size === 0;
		} else {
			return this.storage.delete(key);
		}
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
			totalBytes += new Blob([key]).size;
			totalBytes += new Blob([JSON.stringify(value)]).size;
		}
		return totalBytes;
	}

	get type(): StorageType {
		return StorageType.Memory;
	}
}
