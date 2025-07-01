
<div id="top" align="center" style="text-align:center;">
<h1>
  <img src="./logo.png" alt="Hybrid WebCache" width="128" />
  <br>Hybrid WebCache
  <a href="https://navto.me/heliomarpm" target="_blank"><img src="https://navto.me/assets/navigatetome-brand.png" width="32"/></a>

  [![DeepScan grade][url-deepscan-badge]][url-deepscan]
  [![CodeFactor][url-codefactor-badge]][url-codefactor] 
  ![CodeQL][url-codeql]<!-- ![Publish][url-publish] --> [![NPM version][url-npm-badge]][url-npm]
  [![Downloads][url-downloads-badge]][url-downloads]

  ![lodash](https://img.shields.io/github/package-json/dependency-version/heliomarpm/hybrid-webcache/lodash)  
</h1>

<p>
  <!-- PixMe -->
  <a href="https://www.pixme.bio/heliomarpm" target="_blank" rel="noopener noreferrer">
    <img alt="pixme url" src="https://img.shields.io/badge/donate%20on-pixme-1C1E26?style=for-the-badge&labelColor=1C1E26&color=28f4f4"/>
  </a>
  <!-- PayPal -->
  <a href="https://bit.ly/paypal-sponsor-heliomarpm" target="_blank" rel="noopener noreferrer">
    <img alt="paypal url" src="https://img.shields.io/badge/paypal-1C1E26?style=for-the-badge&labelColor=1C1E26&color=0475fe"/>
  </a>
  <!-- Ko-fi -->
  <a href="https://ko-fi.com/heliomarpm" target="_blank" rel="noopener noreferrer">
    <img alt="kofi url" src="https://img.shields.io/badge/kofi-1C1E26?style=for-the-badge&labelColor=1C1E26&color=ff5f5f"/>
  </a>
  <!-- LiberaPay -->  
  <a href="https://liberapay.com/heliomarpm" target="_blank" rel="noopener noreferrer">
     <img alt="liberapay url" src="https://img.shields.io/badge/liberapay-1C1E26?style=for-the-badge&labelColor=1C1E26&color=f6c915"/>
  </a>
  <!-- Version -->
  <!-- <a href="https://github.com/heliomarpm/hybrid-webcache/releases" target="_blank" rel="noopener noreferrer">
     <img alt="releases url" src="https://img.shields.io/github/v/release/heliomarpm/hybrid-webcache?style=for-the-badge&labelColor=1C1E26&color=2ea043"/>
  </a>   -->
  <!-- License -->
  <!-- <a href="https://github.com/heliomarpm/hybrid-webcache/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">
    <img alt="license url" src="https://img.shields.io/badge/license%20-MIT-1C1E26?style=for-the-badge&labelColor=1C1E26&color=61ffca"/>
  </a> -->
</p>
</div>


## 🎯 About

`HybridWebCache` is a library for efficient cache management in web applications, supporting multiple storage mechanisms transparently (LocalStorage, IndexedDB, SessionStorage, and memory). With TTL (Time-To-Live) support, the library helps optimize performance by storing and retrieving data efficiently.

## 🚀 Features

- Hybrid caching: Allows switching between multiple storage engines dynamically, using the most appropriate one for each scenario (_IndexedDB, LocalStorage, SessionStorage or in-memory_).
  - `IndexedDB`: Uses IndexedDB for caching, **synchronized between tabs via _BroadcastChannel_**.
  - `LocalStorage`: Uses the browser's local storage, **synchronized between tabs via _BroadcastChannel_**.
  - `SessionStorage`: Uses the browser's session storage, **isolated per tab**. Data persists only for the duration of the tab's lifecycle.
  - `Memory`: Uses in-memory storage for caching, **synchronized only with the instance itself**.
- Provides a unified interface for caching data using different storage engines.
- TTL (Time-To-Live) support
- Automatic expiration management (TTL)
- Supports deep key paths like `user.name` or `['user', 'name']` for structured data manipulation.
- Tab synchronization via BroadcastChannel (when applicable)
- Asynchronous and synchronous methods
- Simple integration with modern frameworks
- PWA-compatible
- TypeScript support

## 📁 Project structure:

- `/src` - Main source code
- `/test` - Unit tests
- `/test/demo` - Web demo application

## Main files:

- `src/index.ts` - Entry point
- `src/core/strategies` - Different storage strategies
- `src/core/HybridWebCache.ts` - Main class

## 📦 Installation

You can install the library using `npm` or `yarn`:

```bash
npm i hybrid-webcache
# or 
yarn add hybrid-webcache
```

## 🔧 Basic Usage

To use the library in a TypeScript or modern JavaScript project, you can import it directly:

```ts
import { HybridWebCache } from 'hybrid-webcache';

const cache = new HybridWebCache();

await cache.set('sessionToken', 'abc123', { minutes: 3 });
const token = await cache.get<string>('sessionToken');

console.log(`Token: ${token.value}`); // Output: Token: abc123
```

## 📖 API

To create a HybridWebCache instance, you need to provide a name for the database and optionally settings:

```ts 
const cache = new HybridWebCache('MyApp', {
  ttl: { minutes: 10, days: 1 },
  removeExpired: true,
  storage: StorageEngine.Auto
});
```
> [!NOTE] 
> For `StorageEngine.IndexedDB`, call `await cache.init()` after construction if you want to call synchronous methods.

___
### Methods
- `constructor`: Initializes the cache with a base name and options, determining the storage engine.
  - **Note**: For IndexedDB, is necessary call `await init()` after constructor, for using sync methods.
- `set`/`setSync`: Stores a value in the cache with an optional TTL.
  - **Note**: For `IndexedDB`, `setSync` and `unsetSync` methods update the in-memory cache immediately, but disk persistence operations are queued and executed asynchronously.
- `get`/`getSync`: Retrieves a value from the cache, optionally removing expired entries.
- `unset`/`unsetSync`: Remove a key or clear all
- `has`/`hasSync`: 	Check key existence
- `getAll`/`getAllSync`:  Retrieves all entries as a `Map` of key-value pairs, where each value is an object containing the value, expiration time, and expiration status. Optionally removes expired entries.
- `getJson`/`getJsonSync`: Returns all entries as a JSON object, optionally removing expired entries.
- `resetWith`/`resetWithSync`: Reset all entries with new data

___
### Fields
- `baseName`: The base name for the cache, used as a prefix for keys.
- `options`: Configuration options for the cache, including TTL and storage type.
- `storageEngine`: The storage mechanism used for caching, determined at initialization.

___
### Options

| Parameter       | Type            | Description 
| ---             | ---             | ---
| `ttl`           | `TTL`           | Sets the time to live for data in the cache. Can be in minutes, hours, or days.
| `removeExpired` | `boolean`       | Automatically removes expired items when attempting to access them.
| `storage`       | `StorageEngine` | `Auto`, `LocalStorage`, `IndexedDB`, `SessionStorage` or `Memory`. Sets the storage engine. Auto selects the best available.
|                 | `Auto`          | Automatically selects the best available storage engine based on browser support. 
|                 | `LocalStorage`  | Uses the browser's local storage for caching, with synchronization between **tabs** via BroadcastChannel.
|                 | `IndexedDB`     | Uses IndexedDB for caching, with synchronization between **tabs** via BroadcastChannel.
|                 | `SessionStorage`| Uses the browser's session storage for caching, **isolated per tab**. Data persists only for the duration of the tab's lifecycle..
|                 | `Memory`        | Uses in-memory storage for caching, synchronization only with the **instance itself**.

___
### Types Used

```ts
enum StorageEngine {Auto, LocalStorage, IndexedDB, SessionStorage, Memory }

type ValueType = null | string | number | boolean | object | DictionaryType | ValueType[];
type DictionaryType = { [key: string]: ValueType };

type KeyValues<T extends ValueType> = Record<string, T>;
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

Engine	        | Persistence | Shared across tabs  | TTL   | Sync
---		          | ---		      | ---                 | ---   | ---
IndexedDB	      | ✅          | ✅                 | ✅   | ✅
LocalStorage	  | ✅	         | ✅                 | ✅   | ✅
SessionStorage  |	✅(per tab) | ⛔                 | ✅   | ✅
Memory	        | ⛔          | ⛔                 | ✅   | ✅

> [!NOTE] Synchronous IndexedDB and LocalStorage uses in-memory cache synchronized via BroadcastChannel

### 📚 Usage examples

#### Initialization

```ts
/**
 * Default Options
 * 
 * baseName: 'HybridWebCache',
 * {
 *   ttl: { seconds: 0, minutes: 0, hours: 1, days: 0 },
 *   removeExpired: true,
 *   storage: StorageEngine.Auto
 * }
 */
const cache = new HybridWebCache();
```

#### Initialization with options

```ts
// create an instance for IndexedDB with TTL of 10 minutes and removal of expired items to default
const cache = new HybridWebCache('myCache', { storage: StorageEngine.IndexedDB, ttl: 10 * 60 * 1000, removeExpired: true });
```

#### Set and Get simple

```ts
await cache.set('token', 'abc123');
const token = await cache.get('token').value;

console.log(`Token: ${token}`); // Output: Token: abc123
```

#### Set and Get with TTL customizado

```ts
// Set a value with TTL of 30 seconds
await cache.set('userProfile', { name: 'Jane', age: 25 }, { seconds: 30 }); 
const profile = await cache.get<{ name: string; age: number }>('userProfile');

console.log(`User: ${profile.value.name}, Age: ${profile.value.age}`); 
// Output: User: Jane, Age: 25

console.log(profile); 
// Output: { value: { name: 'Jane', age: 25 }, expiresAt: 999999999, isExpired: false }
```

#### Set and Get with Deep Key path

```ts
await cache.set('user.profile.name', 'Jane');
const name = await cache.get('user.profile.name');

console.log(`Name: ${name}`); // Output: Name: Jane

-- or --
await cache.set(['user', 'profile', 'name'], 'Jane');
const name = await cache.get(['user', 'profile', 'name']);

console.log(`Name: ${name}`); // Output: Name: Jane
```

#### Check if a key exists

```ts
await cache.has('user.profile.name'); // true
```

#### Remove a key

```ts
await cache.unset('user.profile.name');
```

#### Remove all keys
```ts
await cache.unset();
```

#### Get Map of all keys and values 

```ts
const allData = await cache.getAll(); // Map<string, DataGetModel<ValueType>>

// Remove keys that have expired
const allDataWithoutExpired = await cache.getAll(true);
```

#### Get JSON of all keys and values 

```ts
const allData = await cache.getJson(); // { [key: string]: ValueType }

// Remove keys that have expired
const allDataWithoutExpired = await cache.getJson(true); // { [key: string]: ValueType }
```


## Dependencies

- [lodash](https://lodash.com/): For object manipulation
- [Typescript](https://www.typescriptlang.org/): For static typing
- [Jest](https://jestjs.io/): For testing


## 🤝 Contributing

Please make sure to read the [Contributing Guide](docs/CONTRIBUTING.md) before making a pull request.


Thank you to all the people who already contributed to project!

<a href="https://github.com/heliomarpm/hybrid-webcache/graphs/contributors" target="_blank">
  <img src="https://contrib.rocks/image?repo=heliomarpm/hybrid-webcache" />
</a>

###### Made with [contrib.rocks](https://contrib.rocks).

That said, there's a bunch of ways you can contribute to this project, like by:

- :beetle: Reporting a bug
- :page_facing_up: Improving this documentation
- :rotating_light: Sharing this project and recommending it to your friends
- :dollar: Supporting this project on GitHub Sponsors or Ko-fi
- :star2: Giving a star on this repository


## 📢 Support the Project

If you appreciate that, please consider donating to the Developer.

<p>
  <!-- PixMe -->
  <a href="https://www.pixme.bio/heliomarpm" target="_blank" rel="noopener noreferrer">
    <img alt="pixme url" src="https://img.shields.io/badge/donate%20on-pixme-1C1E26?style=for-the-badge&labelColor=1C1E26&color=28f4f4"/>
  </a>
  <!-- PayPal -->
  <a href="https://bit.ly/paypal-sponsor-heliomarpm" target="_blank" rel="noopener noreferrer">
    <img alt="paypal url" src="https://img.shields.io/badge/paypal-1C1E26?style=for-the-badge&labelColor=1C1E26&color=0475fe"/>
  </a>
  <!-- Ko-fi -->
  <a href="https://ko-fi.com/heliomarpm" target="_blank" rel="noopener noreferrer">
    <img alt="kofi url" src="https://img.shields.io/badge/kofi-1C1E26?style=for-the-badge&labelColor=1C1E26&color=ff5f5f"/>
  </a>
  <!-- LiberaPay -->  
  <a href="https://liberapay.com/heliomarpm" target="_blank" rel="noopener noreferrer">
     <img alt="liberapay url" src="https://img.shields.io/badge/liberapay-1C1E26?style=for-the-badge&labelColor=1C1E26&color=f6c915"/>
  </a>  
  <!-- GitHub Sponsors -->
  <a href="https://github.com/sponsors/heliomarpm" target="_blank" rel="noopener noreferrer">
    <img alt="github sponsors url" src="https://img.shields.io/badge/GitHub%20-Sponsor-1C1E26?style=for-the-badge&labelColor=1C1E26&color=db61a2"/>
  </a>
</p>

## 📝 License

[MIT © Heliomar P. Marques](LICENSE) <a href="#top">🔝</a>


----
[url-npm]: https://www.npmjs.com/package/hybrid-webcache
[url-npm-badge]: https://img.shields.io/npm/v/hybrid-webcache.svg
[url-downloads-badge]: https://img.shields.io/npm/dm/hybrid-webcache.svg
[url-downloads]: http://badge.fury.io/js/hybrid-webcache.svg
[url-deepscan-badge]: https://deepscan.io/api/teams/19612/projects/28422/branches/916358/badge/grade.svg
[url-deepscan]: https://deepscan.io/dashboard#view=project&tid=19612&pid=28422&bid=916358
[url-codefactor-badge]: https://www.codefactor.io/repository/github/heliomarpm/hybrid-webcache/badge
[url-codefactor]: https://www.codefactor.io/repository/github/heliomarpm/hybrid-webcache
[url-codeql]: https://github.com/heliomarpm/hybrid-webcache/actions/workflows/codeql.yml/badge.svg 
[url-publish]: https://github.com/heliomarpm/hybrid-webcache/actions/workflows/publish.yml/badge.svg 
