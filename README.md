
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

`HybridWebCache` is a library for efficient cache management in web applications, supporting multiple storage mechanisms transparently (LocalStorage, IndexedDB, SessionStorage and memory). With TTL (Time-To-Live) support, the library helps optimize performance by storing and retrieving data efficiently.

## 🚀 Features

- Hybrid caching 
  - LocalStorage
  - SessionStorage
  - IndexedDB
  - Memory (fallback)
- Automatic expiration management (TTL)
- TypeScript support
- PWA-compatible
- Simple integration with modern frameworks

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

await cache.set('sessionToken', 'abc123');
const token = await cache.get<string>('sessionToken');

console.log(`Token: ${token.value}`); // Output: Token: abc123
```

## 📖 API

To create a HybridWebCache instance, you need to provide a name for the database and optionally settings:

```ts 
const cache = new HybridWebCache('MyApp', {
  ttl: { minutes: 10, days: 1 },
  removeExpired: true,
  storage: StorageType.Auto
});
```

### Main functionalities
- Provides a unified interface for caching data using different storage backends.
- Supports TTL for cache entries to automatically expire data.
- Offers both asynchronous and synchronous methods for setting, getting, and removing cache entries.

___
### Methods
- `constructor`: Initializes the cache with a base name and options, determining the storage engine.
- `set`/`setSync`: Stores a value in the cache with an optional TTL.
- `get`/`getSync`: Retrieves a value from the cache, optionally removing expired entries.
- `unset`/`unsetSync`: Removes a value from the cache.
- `has`/`hasSync`: Checks if a key path exists
- `getAll`/`getAllSync`: Retrieves all cache entries, optionally removing expired ones.
- `getJson`/`getJsonSync`: Returns all cache entries as a JSON object, optionally removing expired ones.
- `resetWith`/`resetWithSync`: Clears the cache and sets new key-value pairs.

___
### Fields
- `baseName`: The base name for the cache, used as a prefix for keys.
- `options`: Configuration options for the cache, including TTL and storage type.
- `storageEngine`: The storage mechanism used for caching, determined at initialization.

___
### Options

| Parameter     | Type          | Description 
| ---           | ---           | ---
| `ttl`           | `TTLType`       | Sets the time to live for data in the cache. Can be in minutes, hours, or days.
| `removeExpired` | `boolean`       | Automatically removes expired items when attempting to access them.
| `storage`       | `StorageType`   | `Auto`, `LocalStorage`, `IndexedDB`, `SessionStorage` or `Memory`. Sets the storage engine. Auto selects the best available.

___
### Types Used

```ts
enum StorageType {
  Auto,
  LocalStorage,
  IndexedDB,
  SessionStorage,
  Memory
}

type ValueTypes = null | string | number | boolean | object | DictionaryType | ValueTypes[];
type DictionaryType = { [key: string]: ValueTypes };

type KeyValues<T extends ValueTypes> = Record<string, T>;
type KeyPath = string | Array<string>;

type TTLType = number | { seconds?: number; minutes?: number; hours?: number; days?: number };

type OptionsType = {
  storage: StorageType;
  ttl: Partial<TTLType>;
  removeExpired: boolean;
};

interface DataSetType<T> {
  value: T;
  expiresAt: number;
}

interface DataGetType<T> extends DataSetType<T> {
  isExpired: boolean;
}

```
___

### Usage examples
```ts

/**
 * Default Options
 * 
 * baseName: 'HybridWebCache',
 * {
 *   ttl: { seconds: 0, minutes: 0, hours: 1, days: 0 },
 *   removeExpired: true,
 *   storage: StorageType.Auto
 * }
 */
const cache = new HybridWebCache()
-- or --
// create an instance for IndexedDB with TTL of 10 minutes and removal of expired items to default
const cache = new HybridWebCache('myCache', { storage: StorageType.IndexedDB, ttl: 10 * 60 * 1000, removeExpired: true });

await cache.set('userProfile', { name: 'Jane', age: 25 });

const profile = await cache.get<{ name: string; age: number }>('userProfile');

console.log(`User: ${profile.value.name}, Age: ${profile.value.age}`); // Output: User: Jane, Age: 25


// Set a value with a TTL of 1 hour
await cache.set('user.firstName', 'John', { hours: 1 });
cache.setSync('user.lastName', 'Doe'); //TTL = 10 minutes

// Retrieve the value
const userName = await cache.get('user.firstName');
// Outputs -> '{value: 'John', expiresAt: 999999999, isExpired: false}'

const user = cache.getSync('user').value;
// Outputs -> {user: {firstName: 'John', lastName: 'Doe' }}

cache.setSync(['user', 'age'], 33);
const user = cache.getSync('user').value;
// Outputs -> {user: {firstName: 'John', lastName: 'Doe', age: 33 }}

// Check if a key exists
const hasUser = await cache.has('user.name');
console.log(hasUser); // Outputs: true

// Remove a key
await cache.unset('user.name');

const color =
{
  "name": "cerulean",
  "code": {
    "hex": "#003BE6",
    "rgb": [0, 179, 230]
  }
}

// Set a key-value
cache.setSync(['settings', 'language'], "pt-Br");
cache.getSync(['settings', 'language']).value;	
// => 'pt-Br'

// Set/Add a key settings
cache.setSync("settings.default", "en");
cache.getSync("settings").value;
// => { "language": "pt-Br", "default": "en" }

cache.getAllSync();	
// => { "settings": {value:{ "language": "pt-Br", "default": "en" },  expiresAt: 1733628804164, isExpired: false }}

// replace key settings
cache.setSync("settings", { theme: "dark"});
cache.getSync("settings").value;
// => { "theme": "dark" }

// Added a new key-value
cache.setSync("color", color);
cache.getSync().value;
// => { "theme": "dark", "color": { "name": "cerulean", "code": { "rgb": [0, 179, 230], "hex": "#003BE6" } } }

// Replace all key-values
cache.setSync(color);
cache.getSync().value;
// => { "name": "cerulean", "code": { "rgb": [0, 179, 230], "hex": "#003BE6" } }

// Unset a key-value
cache.unsetSync();
cache.getSync().value;
// => {}

// Set a new key-values
cache.setSync("color", color);
cache.getSync().value;	
// => { "color": { "name": "cerulean", "code": { "rgb": [0, 179, 230], "hex": "#003BE6" } } }

cache.getSync("color.name").value;
// => "cerulean"

cache.getSync("color.code.hex").value;
// => "#003BE6"

cache.getSync(["color", "code"]).value;
-- or --
cache.getSync("color.code").value;
// => { "hex": "#003BE6", "rgb": [0, 179, 230] }

cache.getSync(["color", "hue"]).value;
// => undefined

// Set a key-value pair
await cache.set("color.name", "sapphire");

// Get the value at a specific key path
const value = await cache.get("color.name").value;
// => "sapphire"

// Check if a key path exists
const exists = await cache.has("color.name");
// => true

// Remove a key-value pair
await cache.unset("color.name");
await cache.getAll();
// Result Map(key, value) => { key: "code", value: {expiresAt: 1733628804164, isExpired: false, value: {"rgb": [0, 179, 230], "hex": "#003BE6" } } }

await cache.getJson();
// => {"code": {"rgb": [0, 179, 230], "hex": "#003BE6"} }

const exists = cache.hasSync("color.name");
// => false

cache.unset().then(() => {
  console.log("All key-value pairs have been removed.");
})

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
