export enum StorageType {
	Auto = 0,
	LocalStorage = 1,
	IndexedDB = 2,
	SessionStorage = 3,
	Memory = 4,
}

export type ValueType = null | string | number | boolean | object | DictionaryType | ValueType[];
type DictionaryType = { [key: string]: ValueType };

export type KeyValues<T extends ValueType> = Record<string, T>;
export type KeyPath = string | Array<string>;

export type TTL = number | { seconds?: number; minutes?: number; hours?: number; days?: number };

export type Options = {
	storage: StorageType;
	ttl: Partial<TTL>;
	removeExpired: boolean;
};

export interface DataSet<T> {
	value: T;
	expiresAt: number;
}

export interface DataGet<T> extends DataSet<T> {
	isExpired: boolean;
}
