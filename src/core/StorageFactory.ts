import { Utils } from "./utils";
import { StorageBase, StorageType } from "./models";
import { IndexedDBStrategy, LocalStorageStrategy, MemoryStrategy, SessionStorageStrategy } from "./strategies";

export class StorageFactory {
	static createStorage(type: StorageType, baseName: string, storeName?: string): StorageBase {
		switch (type) {
			case StorageType.SessionStorage:
				if (!Utils.isSessionStorageAvailable()) throw new Error("SessionStorage is not available");
				return new SessionStorageStrategy(baseName);
			case StorageType.LocalStorage:
				if (!Utils.isLocalStorageAvailable()) throw new Error("LocalStorage is not available");
				return new LocalStorageStrategy(baseName);
			case StorageType.IndexedDB:
				if (!Utils.isIndexedDBAvailable()) throw new Error("IndexedDB is not available");
				return new IndexedDBStrategy(baseName, storeName);
			case StorageType.Auto:
				if (Utils.isLocalStorageAvailable()) {
					return new LocalStorageStrategy(baseName);
				} else if (Utils.isIndexedDBAvailable()) {
					return new IndexedDBStrategy(baseName, storeName);
				} else if (Utils.isSessionStorageAvailable()) {
					return new SessionStorageStrategy(baseName);
				} else {
					return new MemoryStrategy();
				}
			case StorageType.Memory:
			default:
				return new MemoryStrategy();
		}
	}
}
