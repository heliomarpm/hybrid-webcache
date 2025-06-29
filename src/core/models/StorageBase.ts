import type { DataGet, DataSet, StorageType, ValueType } from "./types";

export interface StorageBase {
	set<T extends ValueType>(key: string, data: DataSet<T>): Promise<void>;
	setSync<T extends ValueType>(key: string, data: DataSet<T>): void;

	get<T extends ValueType>(key: string): Promise<DataGet<T> | undefined>;
	getSync<T extends ValueType>(key: string): DataGet<T> | undefined;

	getAll<T extends ValueType>(): Promise<Map<string, DataGet<T>> | null>;
	getAllSync<T extends ValueType>(): Map<string, DataGet<T>> | null;

	has(key: string): Promise<boolean>;

	hasSync(key: string): boolean;

	// unset(): Promise<boolean>;
	// unset(key: string): Promise<boolean>;
	unset(key?: string): Promise<boolean>;

	// unsetSync(): boolean;
	// unsetSync(key: string): boolean;
	unsetSync(key?: string): boolean;

	get length(): number;
	get bytes(): number;
	get type(): StorageType;
}
