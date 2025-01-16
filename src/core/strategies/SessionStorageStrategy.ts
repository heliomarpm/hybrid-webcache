import { StorageBase, DataGetType, DataSetType, StorageType, ValueTypes } from '../models';

export class SessionStorageStrategy implements StorageBase {
	private prefixKey: string;

	constructor(prefixKey: string = 'HybridWebCache') {
		this.prefixKey = `${prefixKey.trim()}::`;
	}

	private formattedKey(key: string): string {
		return `${this.prefixKey}${key}`;
	}

	set<T extends ValueTypes>(key: string, data: DataSetType<T>): Promise<void> {
		return Promise.resolve(this.setSync(key, data));
	}

	setSync<T extends ValueTypes>(key: string, data: DataSetType<T>): void {
		return sessionStorage.setItem(this.formattedKey(key), JSON.stringify(data));
	}

	get<T extends ValueTypes>(key: string): Promise<DataGetType<T> | undefined> {
		return Promise.resolve(this.getSync(key));
	}

	getSync<T extends ValueTypes>(key: string): DataGetType<T> | undefined {
		return this.hasSync(key) ? JSON.parse(sessionStorage.getItem(this.formattedKey(key))!) : undefined;
	}

	getAll(): Promise<Map<string, DataGetType<unknown>> | null> {
		return Promise.resolve(this.getAllSync());
	}

	getAllSync(): Map<string, DataGetType<unknown>> | null {
		const data = new Map();

		for (let i = 0; i < sessionStorage.length; i++) {
			const key = sessionStorage.key(i)!;
			if (key.startsWith(this.prefixKey)) {
				data.set(key.replace(this.prefixKey, ''), JSON.parse(sessionStorage.getItem(key)!));
			}
		}

		return data.size > 0 ? data : null;
	}

	has(key: string): Promise<boolean> {
		return Promise.resolve(this.hasSync(key));
	}

	hasSync(key: string): boolean {
		return !!sessionStorage.getItem(this.formattedKey(key));
	}

	unset(key?: string): Promise<boolean> {
		return Promise.resolve(!key ? this.unsetSync() : this.unsetSync(key));
	}

	unsetSync(key?: string): boolean {
		let result = false;

		if (!key) {
			result = sessionStorage.length > 0;
			let index = 0;
			do {
				const key = sessionStorage.key(index);
				if (key && key.startsWith(this.prefixKey)) {
					sessionStorage.removeItem(key);
					result = true;
				} else {
					index++;
				}
			} while (index < sessionStorage.length);
			return result;
		} else {
			result = this.hasSync(key);
			if (result) {
				const fKey = this.formattedKey(key);
				sessionStorage.removeItem(fKey);
			}
			return result;
		}
	}

	get length(): number {
		return sessionStorage.length;
	}

	get bytes(): number {
		const all = this.getAllSync();
		if (all === null) return 0;

		let totalBytes = 0;
		for (const [key, value] of all) {
			totalBytes += new Blob([key]).size;
			totalBytes += new Blob([JSON.stringify(value)]).size;
		}
		return totalBytes;
	}

	get type(): StorageType {
		return StorageType.SessionStorage;
	}
}
