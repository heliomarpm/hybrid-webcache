import { KeyPath, TTLType } from '../models';

export class Utils {
	static getKey(keyPath: KeyPath): string {
		let key = keyPath.toString();

		// Verificar se keyPath é um array
		if (Array.isArray(keyPath)) {
			// Retorna a primeira chave do array (ex: ["keyName", "subKey"] -> "keyName")
			key = keyPath.length > 0 ? String(keyPath[0]) : '';
		} else {
			// Verificar se é uma string com formato de indexação (ex: "keyName[0].name")
			const match = keyPath.match(/^[^.[\]]+/);
			if (match) {
				// Retorna a primeira parte antes de "." ou "["
				key = match[0];
			}
		}

		return key;
		// return Array.isArray(keyPath) ? `${this.baseName}:${keyPath[0]}` : `${this.baseName}:${keyPath.toString().split(".")[0]}`;
	}

	static convertTTLToMilliseconds(ttl: TTLType): number {
		if (typeof ttl === 'number') return ttl;

		const s = (ttl.seconds || 0) * 1000;
		const m = (ttl.minutes || 0) * 60 * 1000;
		const h = (ttl.hours || 0) * 60 * 60 * 1000;
		const d = (ttl.days || 0) * 24 * 60 * 60 * 1000;

		return s + m + h + d;
	}

	static isExpired(expiresAt: number): boolean {
		return expiresAt > 0 ? expiresAt <= Date.now() : false;
	}

	static isSessionStorageAvailable(): boolean {
		try {
			const testKey = '__test__';
			sessionStorage.setItem(testKey, testKey);
			sessionStorage.removeItem(testKey);
			return true;
		} catch (e) {
			return false;
		}
	}

	static isLocalStorageAvailable(): boolean {
		try {
			const testKey = '__test__';
			localStorage.setItem(testKey, testKey);
			localStorage.removeItem(testKey);
			return true;
		} catch (e) {
			return false;
		}
	}
	static isIndexedDBAvailable(): boolean {
		try {
			return 'indexedDB' in window;
		} catch (e) {
			return false;
		}
	}

	static calculateStorageSize(bytes: number): string {
		const BYTES_PER_KB = 1024;
		const UNITS = ['b', 'kb', 'mb', 'gb'];

		if (bytes <= 0) return '0b';
		if (bytes < BYTES_PER_KB) return `${bytes}b`;

		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + UNITS[i];
	}
}
