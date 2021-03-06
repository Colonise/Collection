import { Any, createFunctionSpy, Expect, Test, TestCase, TestFixture } from 'alsatian';
import { Customiser, Filter } from './';
import { Collection, Dictionary, Finder, Mapper, Remover, Replacer, Transformer } from './collection';

function createTestingCollection<T>(definition: Dictionary<T>, firstIndex?: number, lastIndex?: number) {
    const collection = new Collection();
    const keys = Object.keys(definition).map(key => +key);
    const count = keys.length;

    // tslint:disable-next-line:no-string-literal
    collection['_firstIndex'] = firstIndex !== undefined ? firstIndex : Math.min(...keys);
    // tslint:disable-next-line:no-string-literal
    collection['_lastIndex'] = lastIndex !== undefined ? lastIndex : Math.max(...keys);
    // tslint:disable-next-line:no-string-literal
    collection['_count'] = count;

    keys.forEach(key => (collection[key] = definition[key]));

    return collection;
}

@TestFixture('CollectionTests')
export class CollectionTests {
    @TestCase([], new Collection())
    @Test('should be constructed with default values')
    public construct1<T>(items: T[]) {
        const collection = new Collection(items);

        Expect(collection).toBeDefined();
        Expect(collection.count).toBe(0);
        Expect(collection.firstIndex).toBe(0);
        Expect(collection.lastIndex).toBe(0);
    }

    @TestCase(['a', 'b', 'c', 'd', 'e'], createTestingCollection({ '0': 'a', '1': 'b', '2': 'c', '3': 'd', '4': 'e' }))
    @Test('append() should append an item to the end of a collection')
    public append1<T>(items: T[], expected: Collection<T>) {
        const collection = new Collection();

        collection.append(...items);

        Expect(collection.count).toBe(items.length);
        Expect(collection.firstIndex).toBe(0);
        Expect(collection.lastIndex).toBe(items.length - 1);
        Expect(collection).toEqual(expected);
    }

    @TestCase(
        ['a', 'b', 'c', 'd', 'e'],
        createTestingCollection({ '0': 'a', '-1': 'b', '-2': 'c', '-3': 'd', '-4': 'e' })
    )
    @Test('prepend() should prepend an item to the start of a collection')
    public prepend1<T>(items: T[], expected: Collection<T>) {
        const collection = new Collection();

        collection.prepend(...items);

        Expect(collection.count).toBe(items.length);
        Expect(collection.firstIndex).toBe(-items.length + 1);
        Expect(collection.lastIndex).toBe(0);
        Expect(collection).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c', 'd', 'e'], createTestingCollection({ '1': 'b', '2': 'c', '3': 'd', '4': 'e' }), 'a')
    @Test('remove(item: TItem) should remove an item from a collection')
    public remove1<T>(items: T[], expected: Collection<T>, item: T) {
        const collection = new Collection<T>(items);

        collection.remove(item);

        Expect(collection).toEqual(expected);
    }

    @TestCase(
        ['a', 'b', 'c', 'd', 'e'],
        createTestingCollection({ '1': 'b', '2': 'c', '3': 'd', '4': 'e' }),
        (item: string) => item === 'a'
    )
    @Test('removeBy(remover: Remover<TItem>) should remove items that the filter returns true to from a collection')
    public removeBy1<T>(items: T[], expected: Collection<T>, remover: Remover<T>) {
        const collection = new Collection<T>(items);

        collection.removeBy(remover);

        Expect(collection).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c', 'd', 'e'], createTestingCollection({ '0': 'a', '1': 'b', '3': 'd', '4': 'e' }), 2)
    @Test('delete(index: number) should delete the item at an index from a collection')
    public delete1<T>(items: T[], expected: Collection<T>, index: number) {
        const collection = new Collection<T>(items);

        collection.delete(index);

        Expect(collection).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c', 'd', 'e'], createTestingCollection({ '0': 'a', '1': 'b', '4': 'e' }), 2, 2)
    @Test(
        'delete(index: number, count: number) should delete a number of items starting from an index from a collection'
    )
    public delete2<T>(items: T[], expected: Collection<T>, index: number, count: number) {
        const collection = new Collection<T>(items);

        collection.delete(index, count);

        Expect(collection).toEqual(expected);
    }

    @TestCase(
        ['a', 'b', 'c', 'd', 'e'],
        createTestingCollection({ '0': 'd', '1': 'b', '2': 'c', '3': 'd', '4': 'e' }),
        'a',
        'd'
    )
    @Test('replace(filter: Filter<TItem>) should replace an item in a collection with a replacement item')
    public replace1<T>(items: T[], expected: Collection<T>, item: T, replacement: T) {
        const collection = new Collection<T>(items);

        collection.replace(item, replacement);

        Expect(collection).toEqual(expected);
    }

    @TestCase(
        ['a', 'b', 'c', 'd', 'e'],
        createTestingCollection({ '0': 'f', '1': 'f', '2': 'f', '3': 'f', '4': 'f' }),
        () => 'f'
    )
    @Test('replace(filter: Filter<TItem>) should replace all items in a collection using a replacer')
    public replaceBy1<T>(items: T[], expected: Collection<T>, replacer: Replacer<T>) {
        const collection = new Collection<T>(items);

        collection.replaceBy(replacer);

        Expect(collection).toEqual(expected);
    }

    @TestCase(
        ['a', 'b', 'c', 'd', 'e'],
        createTestingCollection({ '0': '"a"', '1': '"b"', '2': '"c"', '3': '"d"', '4': '"e"' }),
        <T>(v: T) => `"${v}"`
    )
    @Test('replace(filter: Filter<TItem>) should replace all items in a collection using a replacer')
    public map1<T, R>(items: T[], expected: Collection<R>, mapper: Mapper<T, R>) {
        const collection = new Collection<T>(items);

        const actual = collection.map(mapper);

        Expect(actual).toEqual(expected);
    }

    @TestCase(
        ['a', 'b', 'c', 'd', 'e'],
        createTestingCollection({ '0': '"a"', '1': '"b"', '2': '"c"', '3': '"d"', '4': '"e"' }),
        <T>(v: T) => `"${v}"`
    )
    @Test('replace(filter: Filter<TItem>) should replace all items in a collection using a replacer')
    public transform1<T, R>(items: T[], expected: Collection<R>, transformer: Transformer<T, R>) {
        const collection = new Collection<T>(items);

        collection.transform(transformer);

        Expect(collection).toEqual(expected);
    }

    @TestCase(
        ['a', 'b', 'c', 'd', 'e'],
        createTestingCollection({ '0': 'b', '1': 'c', '2': 'd', '3': 'e' }),
        (item: string) => item !== 'a'
    )
    @Test('filter() should return a new filtered collection')
    public filter1<T>(items: T[], expected: Collection<T>, filter: Filter<T>) {
        const collection = new Collection<T>(items);

        const actual = collection.filter(filter);

        Expect(actual).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c', 'd', 'e'])
    @Test('clear() should clear a collection of items')
    public clear1<T>(items: T[]) {
        const collection = new Collection<T>(items);

        const actual = collection.clear();

        Expect(actual).toEqual({});
    }

    @TestCase([], undefined)
    @Test('first() should return the first item of a collection')
    public first1<T>(items: T[], expected: T) {
        const collection = new Collection<T>(items);

        const actual = collection.first();

        Expect(actual).toEqual(expected);
    }

    @TestCase([], undefined)
    @Test('last() should return the last item of a collection')
    public last1<T>(items: T[], expected: T) {
        const collection = new Collection<T>(items);

        const actual = collection.last();

        Expect(actual).toEqual(expected);
    }

    @TestCase(['a'], 'a')
    @TestCase(['a', 'b', 'c', 'd', 'e'], 'a', (item: string) => item === 'a')
    @Test('single() should return the single item from a collection')
    public single1<T>(items: T[], expected: T, filter?: Filter<T>) {
        const collection = new Collection<T>(items);

        const actual = collection.single(filter);

        Expect(actual).toEqual(expected);
    }

    @TestCase([], new Collection())
    @Test('single() should throw an error if a collection is empty')
    public single2<T>(items: T[]) {
        const collection = new Collection<T>(items);

        Expect(() => collection.single()).toThrowError(Error, 'The Collection is empty.');
    }

    @TestCase(['a', 'b', 'c', 'd', 'e'], new Collection())
    @Test('single() should throw an error if a collection has more than one item')
    public single3<T>(items: T[]) {
        const collection = new Collection<T>(items);

        Expect(() => collection.single()).toThrowError(Error, 'The Collection contains more than one item.');
    }

    @TestCase(['a', 'b', 'c', 'd', 'e'], [['a', 0], ['b', 1], ['c', 2]])
    @Test('enumerate() should enumerate through a collection')
    public enumerate1<T>(items: T[], expecteds: [T, number, Collection<T>][]) {
        const collection = new Collection<T>(items);

        const spy = createFunctionSpy();

        collection.enumerate(spy);

        expecteds.forEach(expected => {
            Expect(spy).toHaveBeenCalledWith(expected[0], expected[1], Any(Collection));
        });
    }

    @TestCase(['a', 'b', 'c', 'd', 'e'], [['c', 2], ['b', 1], ['a', 0]])
    @Test('enumerateReverse() should enumerate through a collection in reverse')
    public enumerateReverse1<T>(items: T[], expecteds: [T, number][]) {
        const collection = new Collection<T>(items);

        const spy = createFunctionSpy();

        collection.enumerateReverse(spy);

        expecteds.forEach(expected => {
            Expect(spy).toHaveBeenCalledWith(expected[0], expected[1], Any(Collection));
        });
    }

    @TestCase(['a', 'b', 'c', 'd', 'e'], 'a', (item: string) => item === 'a')
    @Test('find() should return the first item in a collection that the enumerator returns true for')
    public find1<T>(items: T[], expected: T | undefined, finder: Finder<T>) {
        const collection = new Collection<T>(items);

        const actual = collection.find(finder);

        Expect(actual).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c', 'd', 'e'], 'a', (item: string) => item === 'a')
    @Test('findLast() should return the last item in a collection that the enumerator returns true for')
    public findLast1<T>(items: T[], expected: T | undefined, finder: Finder<T>) {
        const collection = new Collection<T>(items);

        const actual = collection.findLast(finder);

        Expect(actual).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c', 'd', 'e'], 0, (item: string) => item === 'a')
    @Test('findIndexBy() should return the first index of an item in a collection that the enumerator returns true for')
    public findIndexBy1<T>(items: T[], expected: number, finder: Finder<T>) {
        const collection = new Collection<T>(items);

        const actual = collection.findIndexBy(finder);

        Expect(actual).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c', 'd', 'e'], 0, 'a')
    @Test('findIndex() should return the first index of an item in a collection')
    public findIndex1<T>(items: T[], expected: number, item: T) {
        const collection = new Collection<T>(items);

        const actual = collection.findIndex(item);

        Expect(actual).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c', 'd', 'e'], 0, (item: string) => item === 'a')
    @Test(
        'findLastIndexBy() should should return the last index of an item in a collection that the enumerator returns true for'
    )
    public findLastIndexBy1<T>(items: T[], expected: number, finder: Finder<T>) {
        const collection = new Collection<T>(items);

        const actual = collection.findLastIndexBy(finder);

        Expect(actual).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c', 'd', 'e'], 0, 'a')
    @Test('findLastIndex() should should return the last index of an item in a collection')
    public findLastIndex1<T>(items: T[], expected: number, item: T) {
        const collection = new Collection<T>(items);

        const actual = collection.findLastIndex(item);

        Expect(actual).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c', 'd', 'e'], true)
    @TestCase([0, 1, 2], true)
    @TestCase([0, undefined, null, NaN, false, ''], false)
    @Test('any() should should check if any items are truthy')
    public any1<T>(items: T[], expected: boolean) {
        const collection = new Collection<T>(items);

        const actual = collection.any();

        Expect(actual).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c', 'd', 'e'], (value: string) => value === 'a', true)
    @TestCase(['a', 'b', 'c', 'd', 'e'], (value: string) => value > 'a', true)
    @TestCase(['a', 'b', 'c', 'd', 'e'], (value: string) => value > 'e', false)
    @Test('any(filter) should should check if any items match the filter')
    public any2<T>(items: T[], filter: Filter<T>, expected: boolean) {
        const collection = new Collection<T>(items);

        const actual = collection.any(filter);

        Expect(actual).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c', 'd', 'e'], true)
    @TestCase([0, 1, 2], false)
    @TestCase([0, undefined, null, NaN, false, ''], false)
    @Test('all() should should check if all items are truthy')
    public all1<T>(items: T[], expected: boolean) {
        const collection = new Collection<T>(items);

        const actual = collection.all();

        Expect(actual).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c', 'd', 'e'], (value: string) => value === 'a', false)
    @TestCase(['a', 'b', 'c', 'd', 'e'], (value: string) => value >= 'a', true)
    @TestCase(['a', 'b', 'c', 'd', 'e'], (value: string) => value > 'a', false)
    @TestCase(['a', 'b', 'c', 'd', 'e'], (value: string) => value > 'c', false)
    @TestCase(['a', 'b', 'c', 'd', 'e'], (value: string) => !!value, true)
    @Test('all(filter) should should check if all items match the filter')
    public all2<T>(items: T[], filter: Filter<T>, expected: boolean) {
        const collection = new Collection<T>(items);

        const actual = collection.all(filter);

        Expect(actual).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c', 'd', 'e'], ['a', 'b', 'c', 'd', 'e'])
    @TestCase(['a', 'b', 'c', 'd', 'e'], ['a1', 'b1', 'c1', 'd1', 'e1'], (item: string) => `${item}1`)
    @Test('toArray() should return a new array version of a collection')
    public toArray1<T, R>(items: T[], expected: T[], customiser?: Customiser<T, R>) {
        const collection = new Collection<T>(items);

        const actual = collection.toArray(customiser);

        Expect(actual).toEqual(expected);
    }

    @TestCase(
        ['a', 'b', 'c', 'd', 'e'],
        { a: 'a', b: 'b', c: 'c', d: 'd', e: 'e' },
        (item: string) => item,
        (item: string) => item
    )
    @Test('toDictionary() should return a new dictionary version of a collection')
    public toDictionary1<T, K, V>(
        items: T[],
        expected: Dictionary<T>,
        keyCustomiser: Customiser<T, K>,
        valueCustomiser?: Customiser<T, V>
    ) {
        const collection = new Collection<T>(items);

        const actual = collection.toDictionary(keyCustomiser, valueCustomiser);

        Expect(actual).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c', 'd', 'e'], ['a', 'b', 'c', 'd', 'e'])
    @Test('[Symbol.iterator]() should return an iterator')
    public symbolIterator1<T>(items: T[], expected: T[]) {
        const collection = new Collection<T>(items);

        const actual = collection[Symbol.iterator]();

        expected.forEach(value => {
            Expect(actual.next()).toEqual({ value, done: false });
        });

        Expect(actual.next()).toEqual({ value: undefined, done: true });
    }

    @TestCase(['a', 'b', 'c', 'd', 'e'], ['a', 'b', 'c', 'd', 'e'])
    @Test('for..of should use the iterator')
    public symbolIterator2<T>(items: T[], expected: T[]) {
        const collection = new Collection<T>(items);

        const actual: T[] = [];

        for (const item of collection) {
            actual.push(item);
        }

        Expect(actual).toEqual(expected);
    }
}
