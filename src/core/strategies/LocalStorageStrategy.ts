import type { DataGetType, DataSetType, StorageBase, ValueTypes } from "../models";
import { StorageType } from "../models";

export class LocalStorageStrategy implements StorageBase {
	private prefixKey: string;

	constructor(prefixKey = "HybridWebCache") {
		this.prefixKey = `${prefixKey.trim()}::`;
	}

	private formattedKey(key: string): string {
		return `${this.prefixKey}${key}`;
	}

	set<T extends ValueTypes>(key: string, data: DataSetType<T>): Promise<void> {
		return Promise.resolve(this.setSync(key, data));
	}

	setSync<T extends ValueTypes>(key: string, data: DataSetType<T>): void {
		localStorage.setItem(this.formattedKey(key), JSON.stringify(data));
	}

	get<T extends ValueTypes>(key: string): Promise<DataGetType<T> | undefined> {
		return Promise.resolve(this.getSync(key));
	}

	getSync<T extends ValueTypes>(key: string): DataGetType<T> | undefined {
		const item = localStorage.getItem(this.formattedKey(key));
		return item ? JSON.parse(item) : undefined;
	}

	getAll<T extends ValueTypes>(): Promise<Map<string, DataGetType<T>> | null> {
		return Promise.resolve(this.getAllSync<T>());
	}

	getAllSync<T extends ValueTypes>(): Map<string, DataGetType<T>> | null {
		const data = new Map();

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith(this.prefixKey)) {
				const item = localStorage.getItem(key);
				data.set(key.replace(this.prefixKey, ""), item ? JSON.parse(item) : item);
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
		return Promise.resolve(this.unsetSync(key));
	}

	unsetSync(key?: string): boolean {
		if (localStorage.length === 0) return false;

		let result = false;
		if (!key) {
			const keysToRemove: string[] = [];
			for (let i = 0; i < localStorage.length; i++) {
				const currentKey = localStorage.key(i);
				if (currentKey?.startsWith(this.prefixKey)) {
					keysToRemove.push(currentKey);
				}
			}
			keysToRemove.forEach((k) => localStorage.removeItem(k));
			result = keysToRemove.length > 0;
		} else {
			result = this.hasSync(key);
			if (result) {
				const fKey = this.formattedKey(key);
				localStorage.removeItem(fKey);
			}
		}
		return result;
	}

	get length(): number {
		// return localStorage.length;
		let count = 0;
		for (let i = 0; i < localStorage.length; i++) {
			if (localStorage.key(i)?.startsWith(this.prefixKey)) {
				count++;
			}
		}
		return count;
	}

	get bytes(): number {
		const all = this.getAllSync();
		if (all === null) return 0;

		// const obj = Object.fromEntries(this.getAllSync()!);
		// const jsonString = JSON.stringify(obj);
		// return new TextEncoder().encode(jsonString).length;

		let totalBytes = 0;
		for (const [key, value] of all) {
			// totalBytes += new Blob([key]).size;
			// totalBytes += new Blob([JSON.stringify(value)]).size;
			totalBytes += new TextEncoder().encode(key).length; // Usando TextEncoder para consist�ncia
			totalBytes += new TextEncoder().encode(JSON.stringify(value)).length;
		}
		return totalBytes;
	}

	get type(): StorageType {
		return StorageType.LocalStorage;
	}
}
