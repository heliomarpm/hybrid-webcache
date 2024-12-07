import { Utils } from '../utils';
import StorageBase, { StorageType } from './models';
import { LocalStorageStrategy, MemoryStrategy } from './strategies';

export class StorageFactory {
	static createStorage(type: StorageType, baseName: string, storeName?: string): StorageBase {
		switch (type) {
			case StorageType.LocalStorage:
				if (!Utils.isLocalStorageAvailable()) throw new Error('LocalStorage is not available');
				return new LocalStorageStrategy(baseName);

			case StorageType.Memory:
			default:
				return new MemoryStrategy();
		}
	}
}
