import StorageBase, { StorageType } from './models';
import { MemoryStrategy } from './strategies';

export class StorageFactory {
	static createStorage(type: StorageType): StorageBase {
		return new MemoryStrategy();
	}
}
