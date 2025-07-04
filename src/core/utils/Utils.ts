import type { KeyPath, TTL } from "../models";


/**
 * Class Helper
 * @internal
 * @ignore
 */
export const Utils = {
	/**
	 * Extracts the primary key from a given KeyPath.
	 *
	 * If the KeyPath is an array, the method returns the first element as a string.
	 * If the KeyPath is a string with indexing format (e.g., "keyName[0].name"),
	 * the method returns the first part before a "." or "[".
	 *
	 * @param keyPath - The KeyPath from which to extract the primary key.
	 * @returns The extracted primary key as a string.
	 */
	getKey(keyPath: KeyPath): string {
		let key = "";

		// Verificar se keyPath é um array
		if (Array.isArray(keyPath)) {
			// Retorna a primeira chave do array (ex: ["keyName", "subKey"] -> "keyName")
			key = keyPath.length > 0 ? String(keyPath[0]) : "";
		} else {
			key = keyPath.toString();
			// Verificar se é uma string com formato de indexação (ex: "keyName[0].name")
			const match = keyPath.match(/^[^.[\]]+/);
			if (match) {
				// Retorna a primeira parte antes de "." ou "["
				key = match[0];
			}
		}

		return key;
	},

	/**
	 * Converts a TTL to milliseconds.
	 *
	 * If the TTL is a number, it is returned as is.
	 * If the TTL is an object, the method sums up the milliseconds from the
	 * following properties: seconds, minutes, hours, and days.
	 *
	 * @param ttl - The TTL to convert.
	 * @returns The TTL converted to milliseconds.
	 */
	convertTTLToMilliseconds(ttl: TTL): number {
		if (typeof ttl === "number") return ttl;

		const s = (ttl.seconds || 0) * 1000;
		const m = (ttl.minutes || 0) * 60 * 1000;
		const h = (ttl.hours || 0) * 60 * 60 * 1000;
		const d = (ttl.days || 0) * 24 * 60 * 60 * 1000;

		return s + m + h + d;
	},

	/**
	 * Checks if a given expiresAt timestamp has expired.
	 *
	 * If the expiresAt timestamp is greater than 0, the method checks if the
	 * current time is greater than or equal to the expiresAt timestamp. If the
	 * expiresAt timestamp is 0 or less, the method returns false.
	 *
	 * @param expiresAt - The timestamp to check.
	 * @returns True if the timestamp has expired, false otherwise.
	 */
	isExpired(expiresAt: number): boolean {
		return expiresAt > 0 ? expiresAt <= Date.now() : false;
	},

	/**
	 * Checks if the sessionStorage is available.
	 *
	 * This method tries to set and remove an item from the sessionStorage.
	 * If the operation is successful, it returns true. Otherwise, it returns false.
	 *
	 * @returns true if the sessionStorage is available, false otherwise.
	 */
	isSessionStorageAvailable(): boolean {
		try {
			const testKey = "__test__";
			sessionStorage.setItem(testKey, testKey);
			sessionStorage.removeItem(testKey);
			return true;
		} catch (_ex) {
			return false;
		}
	},

	/**
	 * Checks if the localStorage is available.
	 *
	 * This method tries to set and remove an item from the localStorage.
	 * If the operation is successful, it returns true. Otherwise, it returns false.
	 *
	 * @returns true if the localStorage is available, false otherwise.
	 */
	isLocalStorageAvailable(): boolean {
		try {
			const testKey = "__test__";
			localStorage.setItem(testKey, testKey);
			localStorage.removeItem(testKey);
			return true;
		} catch (_ex) {
			return false;
		}
	},

	/**
	 * Checks if the IndexedDB is available.
	 *
	 * This method simply checks if the IndexedDB is available in the window object.
	 * If the IndexedDB is available, it returns true. Otherwise, it returns false.
	 *
	 * @returns true if the IndexedDB is available, false otherwise.
	 */
	isIndexedDBAvailable(): boolean {
		try {
			return "indexedDB" in window;
		} catch {
			return false;
		}
	},

	/**
	 * Calculates the size of the given bytes as a human-readable string.
	 *
	 * If the bytes is 0 or less, the method returns "0b".
	 * If the bytes is less than 1024, the method returns the size in bytes.
	 * Otherwise, the method calculates the size in kilobytes, megabytes, or gigabytes
	 * and returns the result as a string with the corresponding unit.
	 *
	 * @param bytes - The number of bytes to calculate the size for.
	 * @returns The calculated size as a human-readable string.
	 */
	calculateStorageSize(bytes: number): string {
		const BYTES_PER_KB = 1024;
		const UNITS = ["b", "kb", "mb", "gb"];

		if (bytes <= 0) return "0b";
		if (bytes < BYTES_PER_KB) return `${bytes}b`;

		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return Number.parseFloat((bytes / 1024 ** i).toFixed(2)) + UNITS[i];
	},
};
