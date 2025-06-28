import { StorageBase, DataGetType, DataSetType, StorageType, ValueTypes } from "../models";

export class LocalStorageStrategy implements StorageBase {
	private prefixKey: string;

	constructor(prefixKey: string = "HybridWebCache") {
		this.prefixKey = `${prefixKey.trim()}::`;
	}

	private formattedKey(key: string): string {
		return `${this.prefixKey}${key}`;
	}

	set<T extends ValueTypes>(key: string, data: DataSetType<T>): Promise<void> {
		return Promise.resolve(this.setSync(key, data));
	}

	setSync<T extends ValueTypes>(key: string, data: DataSetType<T>): void {
		return localStorage.setItem(this.formattedKey(key), JSON.stringify(data));
	}

	get<T extends ValueTypes>(key: string): Promise<DataGetType<T> | undefined> {
		return Promise.resolve(this.getSync(key));
	}

	getSync<T extends ValueTypes>(key: string): DataGetType<T> | undefined {
		return this.hasSync(key) ? JSON.parse(localStorage.getItem(this.formattedKey(key))!) : undefined;
	}

	getAll(): Promise<Map<string, DataGetType<unknown>> | null> {
		return Promise.resolve(this.getAllSync());
	}

	getAllSync(): Map<string, DataGetType<unknown>> | null {
		const data = new Map();

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i)!;
			if (key.startsWith(this.prefixKey)) {
				data.set(key.replace(this.prefixKey, ""), JSON.parse(localStorage.getItem(key)!));
			}
		}

		return data.size > 0 ? data : null;
	}

	has(key: string): Promise<boolean> {
		return Promise.resolve(this.hasSync(key));
	}

	hasSync(key: string): boolean {
		return !!localStorage.getItem(this.formattedKey(key));
	}

	unset(key?: string): Promise<boolean> {
		return Promise.resolve(!key ? this.unsetSync() : this.unsetSync(key));
	}

	unsetSync(key?: string): boolean {
		let result = false;

		if (!key) {
			result = localStorage.length > 0;
			let index = 0;
			do {
				const key = localStorage.key(index);
				if (key && key.startsWith(this.prefixKey)) {
					localStorage.removeItem(key);
					result = true;
				} else {
					index++;
				}
			} while (index < localStorage.length);
			return result;
		} else {
			result = this.hasSync(key);
			if (result) {
				const fKey = this.formattedKey(key);
				localStorage.removeItem(fKey);
			}
			return result;
		}
	}

	get length(): number {
		return localStorage.length;
	}

	get bytes(): number {
		const all = this.getAllSync();
		if (all === null) return 0;

		// const obj = Object.fromEntries(this.getAllSync()!);
		// const jsonString = JSON.stringify(obj);
		// return new TextEncoder().encode(jsonString).length;

		let totalBytes = 0;
		for (const [key, value] of all) {
			totalBytes += new Blob([key]).size;
			totalBytes += new Blob([JSON.stringify(value)]).size;
		}
		return totalBytes;
	}

	get type(): StorageType {
		return StorageType.LocalStorage;
	}
}
