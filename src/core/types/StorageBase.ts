import type { DataModel, StorageEngine, ValueType } from "./types";

/** @ignore */
export interface StorageBase {
	init(): Promise<void>;

	set<T extends ValueType>(key: string, data: DataModel<T>): Promise<void>;
	setSync<T extends ValueType>(key: string, data: DataModel<T>): void;

	get<T extends ValueType>(key: string): Promise<DataModel<T> | undefined>;
	getSync<T extends ValueType>(key: string): DataModel<T> | undefined;

	getAll<T extends ValueType>(): Promise<Map<string, DataModel<T>> | null>;
	getAllSync<T extends ValueType>(): Map<string, DataModel<T>> | null;

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
	get type(): StorageEngine;
}
