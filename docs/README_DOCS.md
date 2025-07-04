<div id="top" align="center">
<h1>
  <br>Hybrid WebCache<a href="https://navto.me/heliomarpm" target="_blank"><img src="https://navto.me/assets/navigatetome-brand.png" width="32"/></a>
</h1>
</div>

## 📚 Summary

`HybridWebCache` is a robust and flexible library designed for efficient cache management in modern web applications. \
It seamlessly supports multiple underlying storage mechanisms (LocalStorage, IndexedDB, SessionStorage, and in-memory Map) and includes built-in Time-To-Live (TTL) support for automatic data expiration. This library helps optimize application performance by providing a unified, easy-to-use API for storing and retrieving data, with intelligent fallbacks and cross-tab synchronization capabilities.

---
## 🎯 When Should You Use This Library?

This library is ideal for web applications that require flexible and persistent data storage beyond simple session or local storage, with a focus on performance, data freshness, and multi-tab consistency.

### 💡 It's a great fit for:

- **Offline-first applications (PWAs)**: Leverage IndexedDB for robust, large-scale offline data storage.
- **Improving perceived performance**: Cache API responses, user preferences, or frequently accessed static data to reduce network requests and load times.
- **Managing user sessions and preferences**: Store non-sensitive user-specific data that needs to persist across browser sessions or tabs.
- **Simplifying cache logic**: Abstract away the complexities of different browser storage APIs into a single, cohesive interface.
- **Applications requiring data expiration**: Automatically clear stale data using configurable TTLs.

### Requirements

- Node.js >= 18 for development/test environment
- Browsers with ES2020 support

---
## 🚀 Main Features

- **Hybrid Storage Strategies**: Automatically selects the best available storage engine (IndexedDB, LocalStorage, SessionStorage, or in-memory) based on browser capabilities and user configuration.
  - `IndexedDB`: Uses IndexedDB for caching, **synchronized between tabs via _BroadcastChannel_**.
  - `LocalStorage`: Uses the browser's local storage, **synchronized between tabs via _BroadcastChannel_**.
  - `SessionStorage`: Uses the browser's session storage, **isolated per tab**. Data persists only for the duration of the tab's lifecycle.
  - `Memory`: Uses in-memory storage for caching, **synchronized only with the instance itself**.
- **Automatic Expiration (TTL)**: Define Time-To-Live for cached items, ensuring data freshness and automatic removal of stale entries.
- **Cross-Tab Synchronization**: Utilizes BroadcastChannel to synchronize data changes across multiple open browser tabs/windows for LocalStorage and IndexedDB strategies, maintaining data consistency.
- **Unified API**: Provides a consistent and intuitive API for all storage operations, abstracting away the underlying storage mechanism complexities.
- **Synchronous & Asynchronous Methods**: Offers both async/await and synchronous versions of key operations (set/setSync, get/getSync, etc.) for flexible integration into your application's flow.
- **Deep Key Path Support**: Easily store and retrieve data from nested objects or arrays using dot notation (`user.profile.name`) or array indexing (`items[0].id`).
- **TypeScript Ready**: Built with TypeScript for strong typing, enhanced developer experience, and compile-time error checking.
- **PWA Compatibility**: Designed with Progressive Web App (PWA) principles in mind, enabling robust offline capabilities when using IndexedDB.
- **Simple Integration**: Integrate with your favorite frameworks, such as Next.js, React, Svelte, or Vue, for a seamless experience.

---
## 🛠 Usage

You can install the library using `npm` or `yarn`:

```bash
npm i hybrid-webcache
# or 
yarn add hybrid-webcache
```

### ✏️ Example Usage

To use the library in a TypeScript or modern JavaScript project, you can import it directly:

- Basic Usage with Default Options (storage: Auto, ttl: 1 hour)
  
```ts
import { HybridWebCache, StorageEngine } from 'hybrid-webcache';

const cache = new HybridWebCache();

await cache.set('sessionToken', 'abc123');
const tokenData = await cache.get<string>('sessionToken');
console.log(`Token: ${tokenData?.value}`); // Output: Token: abc123
console.log(`Is Expired: ${tokenData?.isExpired}`); // Output: Is Expired: false
```

- Creating an instance with custom options (e.g., IndexedDB, 10-minute TTL)

```ts
import { HybridWebCache, StorageEngine } from 'hybrid-webcache';

// Note: For IndexedDB, remember to call .init() if you plan to use synchronous methods
const indexedDBCache = new HybridWebCache('myAppCache', {
  storage: StorageEngine.IndexedDB,
  ttl: { minutes: 10 },
  removeExpired: true,
});
await indexedDBCache.init(); // Initialize IndexedDB to load memory cache for sync operations

//Setting and Getting Nested Data
await indexedDBCache.set('user.profile.firstName', 'John', { hours: 1 });
indexedDBCache.setSync('user.profile.lastName', 'Doe'); // Uses instance's default TTL (10 minutes)
indexedDBCache.setSync(['user', 'profile', 'age'], 30); // Array KeyPath

const userData = await indexedDBCache.get('user.profile');
console.log(userData?.value); // Output: { firstName: 'John', lastName: 'Doe', age: 30 }

const firstNameData = indexedDBCache.getSync('user.profile.firstName');
console.log(firstNameData?.value); // Output: John

// Checking for Key Existence
const hasUser = await indexedDBCache.has('user.profile.firstName');
console.log(`Has user first name: ${hasUser}`); // Output: Has user first name: true

const hasNonExistentKey = indexedDBCache.hasSync('non.existent.key');
console.log(`Has non-existent key: ${hasNonExistentKey}`); // Output: Has non-existent key: false

// Unsetting Data (Partial and Full)
const complexObject = {
  theme: 'dark',
  settings: {
    language: 'en-US',
    notifications: { email: true, sms: false }
  },
  items: ['apple', 'banana', 'orange']
};
await indexedDBCache.set('appConfig', complexObject);

// Unset a nested property
await indexedDBCache.unset('appConfig.settings.notifications.sms');
const updatedAppConfig = await indexedDBCache.get('appConfig');
console.log(updatedAppConfig?.value);
// Output: { theme: 'dark', settings: { language: 'en-US', notifications: { email: true } }, items: ['apple', 'banana', 'orange'] }

// Unset an array element (sets to null)
indexedDBCache.unsetSync('appConfig.items[1]');
const updatedItems = indexedDBCache.getSync('appConfig.items');
console.log(updatedItems?.value); // Output: ['apple', null, 'orange']

// Unset the entire 'appConfig' key
await indexedDBCache.unset('appConfig');
const appConfigAfterUnset = await indexedDBCache.get('appConfig');
console.log(appConfigAfterUnset); // Output: undefined

// Retrieving All Data
await indexedDBCache.set('product1', { id: 1, name: 'Laptop' });
await indexedDBCache.set('product2', { id: 2, name: 'Mouse' });

const allItemsMap = await indexedDBCache.getAll();
console.log(allItemsMap);
/* Output:
Map(2) {
  'product1' => { value: { id: 1, name: 'Laptop' }, expiresAt: ..., isExpired: false },
  'product2' => { value: { id: 2, name: 'Mouse' }, expiresAt: ..., isExpired: false }
}
*/

const allItemsJson = indexedDBCache.getJsonSync();
console.log(allItemsJson);
/* Output:
{
  product1: { id: 1, name: 'Laptop' },
  product2: { id: 2, name: 'Mouse' }
}
*/

// Resetting the Cache
await indexedDBCache.resetWith({
  user: { id: 'user123', status: 'active' },
  app: { version: '1.0.0' }
}, { minutes: 5 }); // New TTL for reset

const resetData = await indexedDBCache.getJson();
console.log(resetData);
/* Output:
{
  user: { id: 'user123', status: 'active' },
  app: { version: '1.0.0' }
}
*/

// Getting Cache Info
const cacheInfo = indexedDBCache.info;
console.log(cacheInfo);
/* Output:
{
  dataBase: 'myAppCache',
  size: 'XXb', // e.g., '120b'
  options: {
    ttl: 300000, // 5 minutes in ms
    removeExpired: true,
    storage: 2 // StorageEngine.IndexedDB
  }
}
*/
```
---
## 📖 API Reference

### Methods

| Method | Description |
| --- | --- |
| `constructor`| Initializes the cache instance.
| `init`| Initializes the underlying storage (e.g., loads IndexedDB data into memory cache). This is crucial for synchronous IndexedDB operations.
| `set` or `setSync`| Asynchronously/Synchronously stores a value at the specified keyPath with an optional TTL.
| `get` or `getSync` | Asynchronously/Synchronously retrieves a value from the cache. Returns DataGetModel including value, expiresAt, and isExpired. Optionally removes expired entries.
| `getAll` or `getAllSync` | Asynchronously/Synchronously retrieves all cache entries as a Map. Optionally removes expired entries.
| `getJson` or `getJsonSync`| Asynchronously/Synchronously retrieves all cache entries as a plain JSON object. Optionally removes expired entries.
| `has` or `hasSync`| Asynchronously/Synchronously checks if a value exists for the specified keyPath.
| `unset` or `unsetSync`| Asynchronously/Synchronously removes a value at the specified keyPath. If no keyPath is provided, clears the entire cache.
| `resetWith` or `resetWithSync`| Asynchronously/Synchronously clears the cache and sets new key-value pairs.
| `length()`| Getter. Returns the number of items currently stored in the cache.
| `bytes()`| Getter. Returns the total number of bytes used by the cache in storage.
| `info()`| Getter. Provides information about the current cache, including database name, size, and options.
| `storageType()`| Getter. Returns the type of storage engine currently used by the cache.

### Options to Constructor

| Parameter       | Type            | Description 
| ---             | ---             | ---
| `ttl`           | `TTL`           | Sets the time to live for data in the cache. Can be in `seconds`, `minutes`, `hours`, or `days`.
| `removeExpired` | `boolean`       | Automatically removes expired items when attempting to access them.
| `storage`       | `StorageEngine` | `Auto`, `LocalStorage`, `IndexedDB`, `SessionStorage` or `Memory`. Sets the storage engine. `Auto` selects the best available.
|                 | `Auto`          | Automatically selects the best available storage engine based on browser support. 
|                 | `IndexedDB`     | Uses IndexedDB for caching, with **synchronization between tabs via BroadcastChannel**.
|                 | `LocalStorage`  | Uses the browser's local storage for caching, with **synchronization between tabs via BroadcastChannel**.
|                 | `SessionStorage`| Uses the browser's session storage for caching, **isolated per tab**. Data persists only for the duration of the tab's lifecycle.
|                 | `Memory`        | Uses in-memory storage for caching, synchronization only with the **instance itself**.

### Types Used

```ts
enum StorageEngine {Auto, LocalStorage, IndexedDB, SessionStorage, Memory }

type ValueType = null | string | number | boolean | object | DictionaryType | ValueType[];
type DictionaryType = { [key: string]: ValueType };

type RecordType<T extends ValueType> = Record<string, T>;
type KeyPath = string | Array<string>;

type TTL = number | { seconds?: number; minutes?: number; hours?: number; days?: number };

type Options = {
  storage: StorageEngine;
  ttl: Partial<TTL>;
  removeExpired: boolean;
};

interface DataModel<T> {
  value: T;
  expiresAt: number;
}

interface DataGetModel<T> extends DataModel<T> {
  isExpired: boolean;
}

```
___

### 📥 Storage and Sync

Engine	        | Persistence | Shared across tabs | TTL  | Sync
---		          | ---		      | ---                | ---  | ---
IndexedDB	      | ✅          | ✅                | ✅   | ✅ (via BroadcastChannel)
LocalStorage	  | ✅	         | ✅                | ✅   | ✅ (via BroadcastChannel)
SessionStorage  |	✅(per tab) | ❌                | ✅   | ✅ 
Memory	        | ❌          | ❌                | ✅   | ✅ 

> [!NOTE] 
> Synchronous operations for IndexedDB and LocalStorage strategies primarily interact with an in-memory cache that is synchronized across tabs via BroadcastChannel. 
> Actual disk persistence for the IndexedDB strategy is handled asynchronously in the background.

---
## ✔️ Project Scripts

* `npm run check` — runs formatter, linter and import sorting to the requested files
* `npm run format` — run the formatter on a set of files
* `npm run lint` — run various checks on a set of files
* `npm run test` — run unit tests
* `npm run test:c` — run unit tests with coverage
* `npm run docs:dev` — run documentation locally
* `npm run commit` - run conventional commits check
* `npm run release:test` — dry run semantic release 
* `npm run build` — build library

---
## 📦 Dependencies

- [lodash](https://lodash.com/): For robust object manipulation (e.g., setting, getting, and unsetting nested properties).
- [Typescript](https://www.typescriptlang.org/): For static typing, improved code quality, and enhanced developer experience.

---
## 🤝 Contributing

We welcome contributions! Whether it's reporting a bug, suggesting a new feature, improving documentation, or submitting a pull request, your help is greatly appreciated.

Please make sure to read before making a pull request:

- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Contributing Guide](./CONTRIBUTING.md)

Thank you to all the people who already contributed to project!

<a href="https://github.com/heliomarpm/hybrid-webcache/graphs/contributors" target="_blank">
  <img src="https://contrib.nn.ci/api?repo=heliomarpm/hybrid-webcache&no_bot=true" />
</a>

###### Made with [contrib.nn](https://contrib.nn.ci/?repo=heliomarpm/hybrid-webcache&no_bot=true).

That said, there's a bunch of ways you can contribute to this project, like by:
  
⭐ Starring the repository \
🐞 Reporting bugs \
💡 Suggest features \
🧾 Improving the documentation \
📢 Sharing this project and recommending it to your friends


## 💵 Support the Project

If you appreciate that, please consider donating to the Developer via GitHub Sponsors, Ko-fi, Paypal or Liberapay, you decide. 😉

<div class="badges">

  [![GitHub Sponsors][url-github-sponsors-badge]][url-github-sponsors]
  [![PayPal][url-paypal-badge]][url-paypal]
  [![Ko-fi][url-kofi-badge]][url-kofi]
  [![Liberapay][url-liberapay-badge]][url-liberapay]

</div>

## 📝 License

[MIT © Heliomar P. Marques](./LICENSE.md) <a href="#top">🔝</a>


----
<!-- Sponsor badges -->
[url-github-sponsors-badge]: https://img.shields.io/badge/GitHub%20-Sponsor-1C1E26?style=for-the-badge&labelColor=1C1E26&color=db61a2
[url-github-sponsors]: https://github.com/sponsors/heliomarpm
[url-paypal-badge]: https://img.shields.io/badge/donate%20on-paypal-1C1E26?style=for-the-badge&labelColor=1C1E26&color=0475fe
[url-paypal]: https://bit.ly/paypal-sponsor-heliomarpm
[url-kofi-badge]: https://img.shields.io/badge/kofi-1C1E26?style=for-the-badge&labelColor=1C1E26&color=ff5f5f
[url-kofi]: https://ko-fi.com/heliomarpm
[url-liberapay-badge]: https://img.shields.io/badge/liberapay-1C1E26?style=for-the-badge&labelColor=1C1E26&color=f6c915
[url-liberapay]: https://liberapay.com/heliomarpm

