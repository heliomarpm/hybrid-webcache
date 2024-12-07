import { DataGetType, DataSetType, StorageType, ValueTypes } from './types';

export interface StorageBase {
	set<T extends ValueTypes>(key: string, data: DataSetType<T>): Promise<void>;
	setSync<T extends ValueTypes>(key: string, data: DataSetType<T>): void;

	get<T extends ValueTypes>(key: string): Promise<DataGetType<T> | undefined>;
	getSync<T extends ValueTypes>(key: string): DataGetType<T> | undefined;

	getAll(): Promise<Map<string, DataGetType<unknown>> | null>;
	getAllSync(): Map<string, DataGetType<unknown>> | null;

	has(key: string): Promise<boolean>;

	hasSync(key: string): boolean;

	unset(): Promise<boolean>;
	unset(key: string): Promise<boolean>;
	unset(key?: string): Promise<boolean>;

	unsetSync(): boolean;
	unsetSync(key: string): boolean;
	unsetSync(key?: string): boolean;

	get length(): number;
	get bytes(): number;
	get type(): StorageType;
}
