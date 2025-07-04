import { type StorageBase, StorageEngine } from "./models";
import { IndexedDBStrategy, LocalStorageStrategy, MemoryStrategy, SessionStorageStrategy } from "./strategies";
import { Utils } from "./utils";

/**
 * @ignore
 */
class StorageFactory {
	createStorage(type: StorageEngine, baseName: string, storeName?: string): StorageBase {
		switch (type) {
			case StorageEngine.SessionStorage:
				if (!Utils.isSessionStorageAvailable()) throw new Error("SessionStorage is not available");
				return new SessionStorageStrategy(baseName);
			case StorageEngine.LocalStorage:
				if (!Utils.isLocalStorageAvailable()) throw new Error("LocalStorage is not available");
				return new LocalStorageStrategy(baseName);
			case StorageEngine.IndexedDB:
				if (!Utils.isIndexedDBAvailable()) throw new Error("IndexedDB is not available");
				return new IndexedDBStrategy(baseName, storeName);
			case StorageEngine.Auto:
				if (Utils.isLocalStorageAvailable()) {
					return new LocalStorageStrategy(baseName);
				}
				if (Utils.isIndexedDBAvailable()) {
					return new IndexedDBStrategy(baseName, storeName);
				}
				if (Utils.isSessionStorageAvailable()) {
					return new SessionStorageStrategy(baseName);
				}
				return new MemoryStrategy();

			default:
				return new MemoryStrategy();
		}
	}
}

/** @ignore */
const storageFactory = new StorageFactory();
/** @ignore */
export { storageFactory as StorageFactory };
