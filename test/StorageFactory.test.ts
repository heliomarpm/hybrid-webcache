import { describe, expect, it } from 'vitest';

import { Utils } from '../src/core/utils';
import { StorageFactory } from '../src/core/StorageFactory';
import { StorageEngine } from '../src';
import { IndexedDBStrategy, LocalStorageStrategy, MemoryStrategy, SessionStorageStrategy } from '../src/core/strategies';

describe('StorageFactory', () => {
  describe('createStorage', () => {
    it('should create SessionStorage when available', () => {
      Utils.isSessionStorageAvailable = () => true;
      const storage = StorageFactory.createStorage(StorageEngine.SessionStorage, 'baseName');
      expect(storage instanceof SessionStorageStrategy).toBe(true);
    });

    it('should throw error when SessionStorage is not available', () => {
      Utils.isSessionStorageAvailable = () => false;
      expect(() => StorageFactory.createStorage(StorageEngine.SessionStorage, 'baseName')).toThrowError('SessionStorage is not available');
    });

    it('should create LocalStorage when available', () => {
      Utils.isLocalStorageAvailable = () => true;
      const storage = StorageFactory.createStorage(StorageEngine.LocalStorage, 'baseName');
      expect(storage instanceof LocalStorageStrategy).toBe(true);
    });

    it('should throw error when LocalStorage is not available', () => {
      Utils.isLocalStorageAvailable = () => false;
      expect(() => StorageFactory.createStorage(StorageEngine.LocalStorage, 'baseName')).toThrowError('LocalStorage is not available');
    });

    it('should create IndexedDB when available', () => {
      Utils.isIndexedDBAvailable = () => true;
      const storage = StorageFactory.createStorage(StorageEngine.IndexedDB, 'baseName', 'storeName');
      expect(storage instanceof IndexedDBStrategy).toBe(true);
    });

    it('should throw error when IndexedDB is not available', () => {
      Utils.isIndexedDBAvailable = () => false;
      expect(() => StorageFactory.createStorage(StorageEngine.IndexedDB, 'baseName', 'storeName')).toThrowError('IndexedDB is not available');
    });

    it('should select LocalStorage when Auto and LocalStorage is available', () => {
      Utils.isLocalStorageAvailable = () => true;
      const storage = StorageFactory.createStorage(StorageEngine.Auto, 'baseName');
      expect(storage instanceof LocalStorageStrategy).toBe(true);
    });

    it('should select IndexedDB when Auto and IndexedDB is available', () => {
      Utils.isLocalStorageAvailable = () => false;
      Utils.isIndexedDBAvailable = () => true;
      const storage = StorageFactory.createStorage(StorageEngine.Auto, 'baseName');
      expect(storage instanceof IndexedDBStrategy).toBe(true);
    });

    it('should select SessionStorage when Auto and SessionStorage is available', () => {
      Utils.isLocalStorageAvailable = () => false;
      Utils.isIndexedDBAvailable = () => false;
      Utils.isSessionStorageAvailable = () => true;
      const storage = StorageFactory.createStorage(StorageEngine.Auto, 'baseName');
      expect(storage instanceof SessionStorageStrategy).toBe(true);
    });

    it('should select MemoryStrategy when Auto and no storage is available', () => {
      Utils.isLocalStorageAvailable = () => false;
      Utils.isIndexedDBAvailable = () => false;
      Utils.isSessionStorageAvailable = () => false;
      const storage = StorageFactory.createStorage(StorageEngine.Auto, 'baseName');
      expect(storage instanceof MemoryStrategy).toBe(true);
    });

    it('should select MemoryStrategy when type is not recognized', () => {
      const storage = StorageFactory.createStorage(999 as any, 'baseName');
      expect(storage instanceof MemoryStrategy).toBe(true);
    });
  });
});
