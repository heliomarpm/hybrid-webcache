import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Utils } from "../src/core/utils";

describe("Utils", () => {
	describe('getKey', () => {
		// getKey extracts first key from array keyPath
		it("should return first element when given array keyPath", () => {
			const keyPath = ["firstKey", "secondKey", "thirdKey"];
			const result = Utils.getKey(keyPath);
			expect(result).toBe("firstKey");
		});

		// getKey extracts base key from string keyPath with dot notation
		it("should extract base key before dot from string keyPath", () => {
			const keyPath = "baseKey.nestedKey.deeperKey";
			const result = Utils.getKey(keyPath);
			expect(result).toBe("baseKey");
		});

		// getKey handles empty array input
		it("should return empty string for empty array keyPath", () => {
			const keyPath: string[] = [];
			const result = Utils.getKey(keyPath);
			expect(result).toBe("");
		});

		// getKey handles complex string patterns with brackets
		it("should extract base key before brackets from complex string", () => {
			const keyPath = "users[0].profile[name]";
			const result = Utils.getKey(keyPath);
			expect(result).toBe("users");
		});
	});

	describe('convertTTLToMilliseconds', () => {

		// Should return same value when input is a number
		it("should return same numeric value when input is a number", () => {
			const input = 5000;
			const result = Utils.convertTTLToMilliseconds(input);
			expect(result).toBe(5000);
		});

		// Should correctly convert seconds to milliseconds
		it("should correctly convert time units to milliseconds", () => {
			const input = {
				seconds: 30,
				minutes: 2,
				hours: 1,
				days: 1,
			};
			const result = Utils.convertTTLToMilliseconds(input);
			const expected = 30 * 1000 + 2 * 60 * 1000 + 1 * 60 * 60 * 1000 + 1 * 24 * 60 * 60 * 1000;
			expect(result).toBe(expected);
		});

		// Should handle empty object and return 0
		it("should return 0 when input is empty object", () => {
			const input = {};
			const result = Utils.convertTTLToMilliseconds(input);
			expect(result).toBe(0);
		});

		// Should handle undefined values for any time unit and treat as 0
		it("should handle undefined time units as 0", () => {
			const input = {
				seconds: undefined,
				minutes: 5,
				hours: undefined,
				days: 1,
			};
			const result = Utils.convertTTLToMilliseconds(input);
			const expected = 5 * 60 * 1000 + 1 * 24 * 60 * 60 * 1000;
			expect(result).toBe(expected);
		});
	});

	describe('isExpired', () => {

		// Returns true when expiresAt is less than current timestamp
		it("should return true when expiresAt is in the past", () => {
			const now = Date.now();
			const pastTimestamp = now - 1000;
			vi.spyOn(Date, "now").mockReturnValue(now);

			const result = Utils.isExpired(pastTimestamp);

			expect(result).toBe(true);
		});

		// Returns true when expiresAt equals current timestamp
		it("should return true when expiresAt equals current timestamp", () => {
			const now = Date.now();
			vi.spyOn(Date, "now").mockReturnValue(now);

			const result = Utils.isExpired(now);

			expect(result).toBe(true);
		});

		// Handle expiresAt value of Number.MAX_SAFE_INTEGER
		it("should return false when expiresAt is Number.MAX_SAFE_INTEGER", () => {
			const now = Date.now();
			vi.spyOn(Date, "now").mockReturnValue(now);

			const result = Utils.isExpired(Number.MAX_SAFE_INTEGER);

			expect(result).toBe(false);
		});

		// Handle expiresAt value of Number.MIN_SAFE_INTEGER
		it("should return false when expiresAt is Number.MIN_SAFE_INTEGER", () => {
			const now = Date.now();
			vi.spyOn(Date, "now").mockReturnValue(now);

			const result = Utils.isExpired(Number.MIN_SAFE_INTEGER);

			expect(result).toBe(false);
		});
	});

	describe('isSessionStorageAvailable', () => {

		// Returns true when sessionStorage is available and working correctly
		it("should return true when sessionStorage is available", () => {
			const result = Utils.isSessionStorageAvailable();
			expect(result).toBe(true);
		});

		// Successfully sets and removes test key from sessionStorage
		it("should set and remove test key from sessionStorage", () => {
			Utils.isSessionStorageAvailable();
			expect(sessionStorage.getItem("__test__")).toBeNull();
		});

		// Returns false when sessionStorage is not available
		it("should return false when sessionStorage is not available", () => {
			Object.defineProperty(window, "sessionStorage", {
				value: undefined,
				writable: true,
			});
			const result = Utils.isSessionStorageAvailable();
			expect(result).toBe(false);
		});
	});

	describe('isLocalStorageAvailable', () => {

		// Returns true when localStorage is available and working correctly

		// Successfully sets and removes test key from localStorage
		it("should set and remove test key from localStorage", () => {
			Utils.isLocalStorageAvailable();
			expect(localStorage.getItem("__test__")).toBeNull();
		});

		// Returns false when localStorage is not available
		it("should return false when localStorage is not available", () => {
			Object.defineProperty(window, "localStorage", {
				value: undefined,
				writable: true,
			});
			const result = Utils.isLocalStorageAvailable();
			expect(result).toBe(false);
		});
	});

	describe('isIndexedDBAvailable', () => {
		let originalWindow: any;
		beforeAll(() => {
			originalWindow = globalThis.window;
		});
		afterEach(() => {
			globalThis.window = originalWindow;
		});

		// Returns false when indexedDB is not available in window object
		it("should return false when indexedDB does not exist in window", () => {
			const result = Utils.isIndexedDBAvailable();
			expect(result).toBe(false);
		});

		it('returns true when IndexedDB is available', () => {
			// Mock window object with IndexedDB
			Object.defineProperty(window, "indexedDB", {
				value: window.indexedDB,
				configurable: true,
				writable: true,
			});
			expect(Utils.isIndexedDBAvailable()).toBe(true);
		});
	});

	describe('calculateStorageSize', () => {
		// Should convert bytes to appropriate unit (b, kb, mb, gb) with correct value
		it("should convert bytes to kb, mb and gb with correct values", () => {
			expect(Utils.calculateStorageSize(1500)).toBe("1.46kb");
			expect(Utils.calculateStorageSize(1500000)).toBe("1.43mb");
			expect(Utils.calculateStorageSize(1500000000)).toBe("1.4gb");
		});

		// Should return bytes with 'b' suffix when input is less than 1024
		it("should return bytes with b suffix when less than 1024", () => {
			expect(Utils.calculateStorageSize(1)).toBe("1b");
			expect(Utils.calculateStorageSize(500)).toBe("500b");
			expect(Utils.calculateStorageSize(1023)).toBe("1023b");
		});

		// Should handle 0 bytes input
		it("should return 0b when input is 0", () => {
			expect(Utils.calculateStorageSize(0)).toBe("0b");
		});

		// Should handle negative byte values
		it("should handle negative byte values correctly", () => {
			expect(Utils.calculateStorageSize(-500)).toBe("0b");
			expect(Utils.calculateStorageSize(-1500)).toBe("0b");
			expect(Utils.calculateStorageSize(-1500000)).toBe("0b");
		});
	});
});
