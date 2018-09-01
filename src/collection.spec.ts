import { Any, createFunctionSpy, Expect, Test, TestCase, TestFixture } from 'alsatian';
import { Customiser, Filter } from './';
import { Collection, Dictionary, Finder, Replacer } from './collection';

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
    public construct1<T>(items: T[], expected: Collection<T>) {
        const collection = new Collection(items);

        Expect(collection).toBeDefined();
        Expect(collection.count).toBe(0);
        Expect(collection.firstIndex).toBe(0);
        Expect(collection.lastIndex).toBe(0);
    }

    @TestCase(createTestingCollection({ '0': 'a', '1': 'b', '2': 'c' }), ['a', 'b', 'c'])
    @Test('append() should append an item to the end of a collection')
    public append1<T>(expected: Collection<T>, items: T[]) {
        const collection = new Collection();

        collection.append(...items);

        Expect(collection.count).toBe(items.length);
        Expect(collection.firstIndex).toBe(0);
        Expect(collection.lastIndex).toBe(items.length - 1);
        Expect(collection).toEqual(expected);
    }

    @TestCase(createTestingCollection({ '0': 'a', '-1': 'b', '-2': 'c' }), ['a', 'b', 'c'])
    @Test('prepend() should prepend an item to the start of a collection')
    public prepend1<T>(expected: Collection<T>, items: T[]) {
        const collection = new Collection();

        collection.prepend(...items);

        Expect(collection.count).toBe(items.length);
        Expect(collection.firstIndex).toBe(-items.length + 1);
        Expect(collection.lastIndex).toBe(0);
        Expect(collection).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c'], createTestingCollection({ '1': 'b', '2': 'c' }), 'a')
    @Test('remove(item: TItem) should remove an item from a collection')
    public remove1<T>(items: T[], expected: Collection<T>, item: T) {
        const collection = new Collection<T>(items);

        collection.remove(item);

        Expect(collection).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c'], createTestingCollection({ '1': 'b', '2': 'c' }), (item: string) => item === 'a')
    @Test('remove(filter: Filter<TItem>) should remove items that the filter returns true to from a collection')
    public remove2<T>(items: T[], expected: Collection<T>, filter: Filter<T>) {
        const collection = new Collection<T>(items);

        collection.remove(filter);

        Expect(collection).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c'], createTestingCollection({ '1': 'b', '2': 'c' }), 0)
    @Test('remove(index: number, count?: number) should remove a number of items from an index of a collection')
    public remove3<T>(items: T[], expected: Collection<T>, index: number, count?: number) {
        const collection = new Collection<T>(items);

        collection.remove(index, count);

        Expect(collection).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c'], createTestingCollection({ '0': 'd', '1': 'b', '2': 'c' }), 'a', 'd')
    @Test('remove(filter: Filter<TItem>) should replace an item in a collection with a replacement item')
    public replace1<T>(items: T[], expected: Collection<T>, item: T, replacement: T) {
        const collection = new Collection<T>(items);

        collection.replace(item, replacement);

        Expect(collection).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c'], createTestingCollection({ '0': 'd', '1': 'b', '2': 'c' }), 0, 'd')
    @Test('remove(filter: Filter<TItem>) should replace an item at an index in a collection with a replacement item')
    public replace2<T>(items: T[], expected: Collection<T>, index: number, replacement: T) {
        const collection = new Collection<T>(items);

        collection.replace(index, replacement);

        Expect(collection).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c'], createTestingCollection({ '0': 'd', '1': 'd', '2': 'd' }), (item: string) => 'd')
    @Test('remove(filter: Filter<TItem>) should replace all items in a collection using a replacer')
    public replace3<T>(items: T[], expected: Collection<T>, replacer: Replacer<T>) {
        const collection = new Collection<T>(items);

        collection.replace(replacer);

        Expect(collection).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c'], createTestingCollection({ '0': 'b', '1': 'c' }), (item: string) => item !== 'a')
    @Test('filter() should return a new filtered collection')
    public filter1<T>(items: T[], expected: Collection<T>, filter: Filter<T>) {
        const collection = new Collection<T>(items);

        const actual = collection.filter(filter);

        Expect(actual).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c'])
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
    @TestCase(['a', 'b', 'c'], 'a', (item: string) => item === 'a')
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

    @TestCase(['a', 'b', 'c'], new Collection())
    @Test('single() should throw an error if a collection has more than one item')
    public single3<T>(items: T[]) {
        const collection = new Collection<T>(items);

        Expect(() => collection.single()).toThrowError(Error, 'The Collection contains more than one item.');
    }

    @TestCase(['a', 'b', 'c'], [['a', 0], ['b', 1], ['c', 2]])
    @Test('enumerate() should enumerate through a collection')
    public enumerate1<T>(items: T[], expecteds: [T, number, Collection<T>][]) {
        const collection = new Collection<T>(items);

        const spy = createFunctionSpy();

        collection.enumerate(spy);

        expecteds.forEach(expected => {
            Expect(spy).toHaveBeenCalledWith(expected[0], expected[1], Any(Collection));
        });
    }

    @TestCase(['a', 'b', 'c'], [['c', 2], ['b', 1], ['a', 0]])
    @Test('enumerateReverse() should enumerate through a collection in reverse')
    public enumerateReverse1<T>(items: T[], expecteds: [T, number][]) {
        const collection = new Collection<T>(items);

        const spy = createFunctionSpy();

        collection.enumerateReverse(spy);

        expecteds.forEach(expected => {
            Expect(spy).toHaveBeenCalledWith(expected[0], expected[1], Any(Collection));
        });
    }

    @TestCase(['a', 'b', 'c'], 'a', (item: string) => item === 'a')
    @Test('find() should return the first item in a collection that the enumerator returns true for')
    public find1<T>(items: T[], expected: T | undefined, finder: Finder<T>) {
        const collection = new Collection<T>(items);

        const actual = collection.find(finder);

        Expect(actual).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c'], 'a', (item: string) => item === 'a')
    @Test('findLast() should return the last item in a collection that the enumerator returns true for')
    public findLast1<T>(items: T[], expected: T | undefined, finder: Finder<T>) {
        const collection = new Collection<T>(items);

        const actual = collection.findLast(finder);

        Expect(actual).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c'], 0, (item: string) => item === 'a')
    @Test('findIndexBy() should return the first index of an item in a collection that the enumerator returns true for')
    public findIndexBy1<T>(items: T[], expected: number, finder: Finder<T>) {
        const collection = new Collection<T>(items);

        const actual = collection.findIndexBy(finder);

        Expect(actual).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c'], 0, 'a')
    @Test('findIndex() should return the first index of an item in a collection')
    public findIndex1<T>(items: T[], expected: number, item: T) {
        const collection = new Collection<T>(items);

        const actual = collection.findIndex(item);

        Expect(actual).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c'], 0, (item: string) => item === 'a')
    @Test(
        'findLastIndexBy() should should return the last index of an item in a collection that the enumerator returns true for'
    )
    public findLastIndexBy1<T>(items: T[], expected: number, finder: Finder<T>) {
        const collection = new Collection<T>(items);

        const actual = collection.findLastIndexBy(finder);

        Expect(actual).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c'], 0, 'a')
    @Test('findLastIndex() should should return the last index of an item in a collection')
    public findLastIndex1<T>(items: T[], expected: number, item: T) {
        const collection = new Collection<T>(items);

        const actual = collection.findLastIndex(item);

        Expect(actual).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c'], true)
    @TestCase([0, 1, 2], true)
    @TestCase([0, undefined, null, NaN, false, ''], false)
    @Test('any() should should check if any items are truthy')
    public any1<T>(items: T[], expected: boolean) {
        const collection = new Collection<T>(items);

        const actual = collection.any();

        Expect(actual).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c'], (value: string) => value === 'a', true)
    @TestCase(['a', 'b', 'c'], (value: string) => value > 'a', true)
    @TestCase(['a', 'b', 'c'], (value: string) => value > 'c', false)
    @Test('any(filter) should should check if any items match the filter')
    public any2<T>(items: T[], filter: Filter<T>, expected: boolean) {
        const collection = new Collection<T>(items);

        const actual = collection.any(filter);

        Expect(actual).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c'], true)
    @TestCase([0, 1, 2], false)
    @TestCase([0, undefined, null, NaN, false, ''], false)
    @Test('all() should should check if all items are truthy')
    public all1<T>(items: T[], expected: boolean) {
        const collection = new Collection<T>(items);

        const actual = collection.all();

        Expect(actual).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c'], (value: string) => value === 'a', false)
    @TestCase(['a', 'b', 'c'], (value: string) => value >= 'a', true)
    @TestCase(['a', 'b', 'c'], (value: string) => value > 'a', false)
    @TestCase(['a', 'b', 'c'], (value: string) => value > 'c', false)
    @TestCase(['a', 'b', 'c'], (value: string) => !!value, true)
    @Test('all(filter) should should check if all items match the filter')
    public all2<T>(items: T[], filter: Filter<T>, expected: boolean) {
        const collection = new Collection<T>(items);

        const actual = collection.all(filter);

        Expect(actual).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c'], ['a', 'b', 'c'])
    @TestCase(['a', 'b', 'c'], ['a1', 'b1', 'c1'], (item: string) => `${item}1`)
    @Test('toArray() should return a new array version of a collection')
    public toArray1<T, R>(items: T[], expected: T[], customiser?: Customiser<T, R>) {
        const collection = new Collection<T>(items);

        const actual = collection.toArray(customiser);

        Expect(actual).toEqual(expected);
    }

    @TestCase(['a', 'b', 'c'], { a: 'a', b: 'b', c: 'c' }, (item: string) => item, (item: string) => item)
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

    @TestCase(['a', 'b', 'c'], ['a', 'b', 'c'])
    @Test('[Symbol.iterator]() should return an iterator')
    public symbolIterator1<T>(items: T[], expected: T[]) {
        const collection = new Collection<T>(items);

        // tslint:disable-next-line:no-any
        const actual = (<any>collection)[Symbol.iterator]();

        expected.forEach(value => {
            Expect(actual.next()).toEqual({ value, done: false });
        });

        Expect(actual.next()).toEqual({ value: undefined, done: true });
    }
}
