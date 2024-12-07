export enum StorageType {
	Memory,
}

export type ValueTypes = null | string | number | boolean | object | DictionaryType | ValueTypes[];
type DictionaryType = { [key: string]: ValueTypes };

export type KeyValues<T extends ValueTypes> = Record<string, T>;
export type KeyPath = string | Array<string>;

export type TTLType = number | { seconds?: number; minutes?: number; hours?: number; days?: number };

export type OptionsType = {
	ttl: Partial<TTLType>;
	removeExpired: boolean;
};

export type SetOptionsType = {
	ttl: Partial<TTLType>;
};

export type GetOptionsType = {
	removeExpired: boolean;
};

export interface DataSetType<T> {
	value: T;
	expiresAt: number;
}

export interface DataGetType<T> extends DataSetType<T> {
	isExpired: boolean;
}
