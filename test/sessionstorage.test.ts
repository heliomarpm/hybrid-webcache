import { HybridWebCache, StorageType } from '../src';

const complex = {
	name: 'complex',
	type: 'object',
	properties: {
		height: 20,
		width: 20,
	},
};

interface IPerson {
	name: string;
	age: number;
}

const person: IPerson = {
	name: 'John Doe',
	age: 30,
};

const persons: IPerson[] = [
	{ name: 'John Doe', age: 30 },
	{ name: 'Jane Doe', age: 33 },
];

describe('SessionStorage Strategy', () => {
	const hwc = new HybridWebCache('HybridWebCacheTest', { storage: StorageType.SessionStorage, removeExpired: false, ttl: { seconds: 1 } });

	beforeAll(() => {
		Object.defineProperty(window, 'sessionStorage', {
			value: (() => {
				let store: Record<string, string> = {};
				return {
					getItem: (key: string) => store[key] || null,
					setItem: (key: string, value: string) => (store[key] = value),
					removeItem: (key: string) => delete store[key],
					clear: () => (store = {}),
					key: (index: number) => Object.keys(store)[index] || null,
					get length() {
						return Object.keys(store).length;
					},
				};
			})(),
			writable: true,
		});

		hwc.unsetSync();

		// Object.defineProperty(window, 'indexedDB', {
		// 	value: require('fake-indexeddb'),
		// 	writable: true
		// });
	});
	afterAll(() => hwc.unsetSync());

	it('test info size', () => {
		expect(hwc.length).toBe(0);
		expect(hwc.bytes).toBe(0);

		hwc.setSync('persons', persons);
		expect(hwc.length).toBe(1);
		expect(hwc.bytes).toBeGreaterThanOrEqual(100);
		expect(hwc.info.size).toBeDefined();
	});

	it('should initialize with default options when no options provided', () => {
		const cache = new HybridWebCache("sessionDB", { storage: StorageType.SessionStorage });

		expect(cache.info.options).toEqual({
			ttl: 3600000,
			removeExpired: true,
			storage: StorageType.SessionStorage
		});

		expect(cache.storageType).toBe(StorageType.SessionStorage);
	});


	it('should remove expired item when removeExpired is true', async () => {
		const cache = new HybridWebCache('test', {
			ttl: { seconds: 1 },
			removeExpired: true
		});

		await cache.set('testKey', 'testValue');
		expect((await cache.get('testKey'))!.value).toBe('testValue');

		await new Promise(resolve => setTimeout(resolve, 1100));

		const result = await cache.get('testKey', false);

		expect(result?.isExpired).toBeTruthy();
		await cache.get('testKey', true);
		expect(await cache.has('testKey')).toBeFalsy();
	});

	it('test set/get property string type', async () => {
		await hwc.set('str', 'strValue');
		expect((await hwc.has('str'))).toBeTruthy();
		expect((await hwc.get('str'))!.value).toBe('strValue');
	});
	it('test setSync/getSync property string type', () => {
		hwc.setSync('strSync', 'strValueSync');
		expect(hwc.getSync('strSync')!.value).toBe('strValueSync');
	});

	it('test set/get property number type', async () => {
		await hwc.set('num', 1);
		expect((await hwc.get('num'))!.value).toBe(1);
	});

	it('test setSync/getSync property number type', () => {
		hwc.setSync('numSync', 2);
		expect(hwc.getSync('numSync')!.value).toBe(2);
	});

	it('test set/get property decimal value', async () => {
		await hwc.set('decSync', 2024.11);
		expect((await hwc.get<number>('decSync'))!.value).toBeGreaterThanOrEqual(2024.11);
	});
	it('test setSync/getSync property decimal value', () => {
		hwc.setSync('decSync', 2024.11);
		expect(hwc.getSync<number>('decSync')!.value).toBeGreaterThanOrEqual(2024.11);
	});

	it('test set/get property boolean type', async () => {
		await hwc.set('boolean', true);
		expect((await hwc.get('boolean'))!.value).toBeTruthy();
	});
	it('test setSync/getSync property boolean type', () => {
		hwc.setSync('booleanSync', false);
		expect(hwc.getSync('booleanSync')!.value).toBeFalsy();
	});

	it('test set/get property array type', async () => {
		await hwc.set('arr', ['testA', 'testB']);
		expect((await hwc.get<object>('arr'))!.value).toMatchObject(['testA', 'testB']);
	});
	it('test setSync/getSync property array type', () => {
		hwc.setSync('arrSync', ['testASync', 'testBSync', 'testCSync']);
		expect(hwc.getSync<object>('arrSync')!.value).toMatchObject(['testASync', 'testBSync', 'testCSync']);
	});

	it('test set/get property object type', async () => {
		await hwc.set('obj', { nome: 'Heliomar' });
		expect((await hwc.get('obj.nome'))!.value).toBe('Heliomar');
	});
	it('test setSync/getSync property object type', () => {
		hwc.setSync('objSync', { nome: 'Heliomar' });
		expect(hwc.getSync('obj.nome')!.value).toBe('Heliomar');
	});

	it('test set/get increment in object type using ArrayProperties', async () => {
		await hwc.set(['obj', 'conjugue'], 'Angelina');
		expect((await hwc.get('obj.conjugue'))!.value).toBe('Angelina');
	});
	it('test setSync/getSync property object type using ArrayProperties', () => {
		hwc.setSync(['objSync', 'conjugue'], 'Angelina');
		expect(hwc.getSync('objSync.conjugue')!.value).toBe('Angelina');
	});

	it('test set/get increment in object type using NestedProperties (ttlMs/notRemoveExpired)', async () => {
		await hwc.set('obj.sobreNome', 'Marques', { seconds: 0.0001 });
		expect((await hwc.get('obj.sobreNome', false))!.value).toBe('Marques');
	});
	it('test setSync/getSync property object type using NestedProperties (ttlMs/notRemoveExpired)', () => {
		hwc.setSync('objSync.sobreNome', 'Marques', { seconds: 0.0001 });
		expect(hwc.getSync('objSync.sobreNome', false)!.value).toBe('Marques');
	});

	it('test get all property after added keys', async () => {
		expect((await hwc.get<object>('obj'))!.value).toMatchObject({ nome: 'Heliomar', sobreNome: 'Marques', conjugue: 'Angelina' });
	});
	it('test getSync all property after added keys', () => {
		expect(hwc.getSync<object>('objSync')!.value).toMatchObject({ nome: 'Heliomar', sobreNome: 'Marques', conjugue: 'Angelina' });
	});

	it('test get remove expired (NestedProperties)', async () => {
		//runner after 1 second
		expect((await hwc.get('obj.sobreNome', false))!.value).toBe('Marques');
		expect(await hwc.get('obj.sobreNome', true)).toBeUndefined();
	}, 1000);
	it('test getSync remove expired (NestedProperties)', () => {
		//runner after 1 second
		expect(hwc.getSync('objSync.sobreNome', false)!.value).toBe('Marques');
		expect(hwc.getSync('objSync.sobreNome', true)).toBeUndefined();
	}, 1000);

	it('test get all properties after removing key', async () => {
		expect((await hwc.get<object>('obj'))!.value).toMatchObject({ nome: 'Heliomar', conjugue: 'Angelina' });
	});
	it('test get all properties after removing key', () => {
		expect(hwc.getSync<object>('objSync')!.value).toMatchObject({ nome: 'Heliomar', conjugue: 'Angelina' });
	});

	it('test set/get property with dot in key', async () => {
		await hwc.set(['obj.filiacao', 'mae'], 'Lolita');
		expect((await hwc.get<object>(['obj.filiacao']))!.value).toMatchObject({ mae: 'Lolita' });
	});
	it('test getSync NestedProperties (removeExpired)', () => {
		hwc.setSync(['objSync.filiacao', 'mae'], 'Lolita');
		expect(hwc.getSync<object>(['objSync.filiacao'])!.value).toMatchObject({ mae: 'Lolita' });
	});

	it('test set/get on ttl expired and not remove expired', async () => {
		// set expired in .0001 = 1ms
		await hwc.set('user', { name: 'John Doe', age: 30 }, { seconds: 0.0001 });
		// force do not remove
		expect((await hwc.get<object>('user', false))!.value).toMatchObject({ age: 30, name: 'John Doe' });
	});
	it(
		'test get with remove expired',
		async () => {
			// not remove expired cache
			expect(await hwc.get('user', false)).toBeDefined();
			// remove expired cache
			expect(await hwc.get('user', true)).toBeUndefined();
		},
		1 * 1000,
	); //1s

	it('test setSync/getSync on ttl expired and not remove expired', () => {
		// set expired in .0001 = 1ms
		hwc.setSync('user', { name: 'John Doe', age: 30 }, { seconds: 0.0001 });
		// force do not remove
		expect(hwc.getSync<object>('user', false)!.value).toMatchObject({ age: 30, name: 'John Doe' });
	});
	it(
		'test getSync with remove expired',
		() => {
			// not remove expired cache
			expect(hwc.getSync('user', false)).toBeDefined();
			// remove expired cache
			expect(hwc.getSync('user', true)).toBeUndefined();
		},
		1 * 1000,
	); //1s

	it('test resetWith property', async () => {
		await hwc.resetWith({ propAsync: true });
		expect((await hwc.get('propAsync'))?.value).toBeTruthy();
	});
	it('test resetWithSync property', () => {
		hwc.resetWithSync({ testResetWith: 'OK', testSync: 'inRunner' });
		expect(hwc.getSync('testResetWith')!.value).toEqual('OK');
		expect(hwc.getSync('testSync')!.value).toEqual('inRunner');
	});

	it('test set/get property value null', async () => {
		await hwc.set('nullAsync', null);
		expect((await hwc.get('nullAsync'))!.value).toBeNull();
	});
	it('test setSync/getSync property value null', () => {
		hwc.setSync<null>('null', null);
		expect(hwc.getSync<null>('null')!.value).toBeNull();
	});

	it('test set/get property complex type', async () => {
		await hwc.set('complex', complex);
		const r = await hwc.get('complex');
		expect(typeof r!.value).toEqual(typeof complex);
	});
	it('test setSync/getSync property complex type', () => {
		hwc.setSync('complexSync', complex);
		const r = hwc.getSync('complexSync');
		expect(typeof r!.value).toEqual(typeof complex);
	});

	it('test get of object complex', async () => {
		const o = await hwc.get<typeof complex>('complex');
		expect(o!.value.properties.height).toEqual(20);
	});
	it('test getSync of object complex', () => {
		const o = hwc.getSync<typeof complex>('complexSync');
		expect(o!.value.properties.height).toEqual(20);
	});

	it('test get object.property', async () => {
		const r = await hwc.get<string>('complex.name');
		expect(r!.value).toEqual('complex');
	});
	it('test getSync object.property', () => {
		const r = hwc.getSync<string>('complexSync.name');
		expect(r!.value).toEqual('complex');
	});

	it('test get<number> object.property.property', async () => {
		const r = await hwc.get<number>('complex.properties.width');
		expect(r!.value).toEqual(20);
	});
	it('test getSync<number> object.property.property', () => {
		const r = hwc.getSync<number>('complex.properties.width');
		expect(r!.value).toEqual(20);
	});

	it('test has propertie', () => {
		expect(hwc.hasSync('complexSync')).toBeTruthy();
	});

	it('test unset propertie', () => {
		hwc.unsetSync('complexSync');
		expect(hwc.hasSync('complexSync')).toBeFalsy();
	});

	it('test set/get of interfae', async () => {
		await hwc.set<IPerson>('person', person);
		const r = await hwc.get<IPerson>('person');
		expect(r!.value.name).toEqual('John Doe');
	});
	it('test setSync/getSync of interfae', () => {
		hwc.setSync<IPerson>('person', person);
		const r = hwc.getSync<IPerson>('person');
		expect(r!.value.name).toEqual('John Doe');
	});

	it('test set/get of array map object', async () => {
		const mapPerson = persons.map(person => ({ ...person }));
		await hwc.set('persons', mapPerson);
		const r = await hwc.get<IPerson[]>('persons')!;
		expect(r!.value[1].name).toEqual('Jane Doe');
	});
	it('test setSync/getSync of array map object', () => {
		const mapPerson = persons.map(person => ({ ...person }));
		hwc.setSync('persons', mapPerson);
		const r = hwc.getSync<IPerson[]>('persons')!;
		expect(r!.value[1].name).toEqual('Jane Doe');
	});

	it('test get of string (person[1].name)', async () => {
		const r = await hwc.get<string>('persons[1].name');
		expect(r!.value).toEqual('Jane Doe');
	});
	it('test getSync of string (person[1].name)', () => {
		const r = hwc.getSync<string>('persons[1].name');
		expect(r!.value).toEqual('Jane Doe');
	});

	it('test get of Record<string, string>(persons[1])', async () => {
		const r = await hwc.get<Record<string, string>>('persons[1]');
		expect(r!.value['age']).toEqual(33);
	});
	it('test get of Record<string, string>(persons[1])', () => {
		const r = hwc.getSync<Record<string, string>>('persons[1]');
		expect(r!.value['age']).toEqual(33);
	});

	it('test set/get of array object', async () => {
		await hwc.set('persons_index', [{ ...persons }]);
		const r = await hwc.get<IPerson[]>('persons_index');
		expect(r!.value).toStrictEqual([{ ...persons }]);
	});
	it('test setSync/getSync of array object', () => {
		hwc.setSync('persons_index', [{ ...persons }]);
		const r = hwc.getSync<IPerson[]>('persons_index');
		expect(r!.value).toStrictEqual([{ ...persons }]);
	});

	it('test get undefined value', async () => {
		const r = await hwc.get('undefined');
		expect(r).toBeUndefined();
	});
	it('test get undefined value', () => {
		const r = hwc.getSync('undefined');
		expect(r).toBeUndefined();
	});

	it('test has undefined propertie', async () => {
		expect(await hwc.has('undefined')).toBeFalsy();
	});
	it('test hasSync undefined propertie', () => {
		expect(hwc.hasSync('undefined')).toBeFalsy();
	});

	it('test unset undefined propertie', async () => {
		expect(await hwc.unset('undefined')).toBeFalsy();
	});
	it('test unsetSync undefined propertie', () => {
		expect(hwc.unsetSync('undefined')).toBeFalsy();
	});

	it('test set/get change property value', async () => {
		await hwc.set('string', 'original value');
		expect((await hwc.get('string'))!.value).toBe('original value');

		await hwc.set('string', 'change value');
		expect((await hwc.get('string'))!.value).toBe('change value');
	});
	it('test setSync/getSync change property value', () => {
		hwc.setSync('stringSync', 'original value');
		expect(hwc.getSync('stringSync')!.value).toBe('original value');

		hwc.setSync('stringSync', 'change value');
		expect(hwc.getSync('stringSync')!.value).toBe('change value');
	});

	it('test get all async', async () => {
		const r = await hwc.getAll();
		expect(r).toBeDefined();
	});
	it('test getSync all', () => {
		const r = hwc.getAllSync();
		expect(r).toBeDefined();
	});

	it('test getJson', async () => {
		const r = await hwc.getJson();
		expect(r).toBeDefined();
	});
	it('test getJsonSync', () => {
		const r = hwc.getJsonSync();
		expect(r).toBeDefined();
	});

	it('test has key', async () => {
		expect(await hwc.has('string')).toBeTruthy();
	});
	it('test hasSync key', async () => {
		expect(hwc.hasSync('stringSync')).toBeTruthy();
	});

	it('test unset key', async () => {
		expect(await hwc.unset('string')).toBeTruthy();
		expect(await hwc.has('string')).toBeFalsy();
	});
	it('test unsetSync key', () => {
		expect(hwc.unsetSync('stringSync')).toBeTruthy();
		expect(hwc.hasSync('stringSync')).toBeFalsy();
	});

	it('test unset/get ', () => {
		hwc.unsetSync('boolean');
		expect(hwc.getSync('boolean')).toBeUndefined();
	});

	it('test unsetAll/get all async', async () => {
		await hwc.unset();
		expect(await hwc.getAll()).toBeNull();
	});

	it('test unsetAll/get all', () => {
		hwc.setSync('novo_item', true);
		hwc.unsetSync();
		expect(hwc.getAllSync()).toBeNull();
	});
});
