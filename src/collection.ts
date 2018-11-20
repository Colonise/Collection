import { makeNonEnumerable } from './utils';

export type Enumerator<TItem, TResult> = (item: TItem, index: number, collection: Collection<TItem>) => TResult;
export type Checker<TItem> = Enumerator<TItem, unknown>;
export type Filter<TItem> = Enumerator<TItem, unknown>;
export type Remover<TItem> = Enumerator<TItem, unknown>;
export type Replacer<TItem> = Enumerator<TItem, TItem>;
export type Finder<TItem> = Enumerator<TItem, unknown>;
export type Customiser<TItem, TResult> = Enumerator<TItem, TResult>;

// Symbol polyfill
if (!Symbol) {
    Symbol = <SymbolConstructor>{};
}

// Symbol.iterator polyfill
if (!Symbol.iterator) {
    (<{ iterator: symbol }>Symbol).iterator = <symbol>{};
}

export interface StringDictionary<TValue> {
    [key: string]: TValue;
}

export interface NumberDictionary<TValue> {
    [key: number]: TValue;
}

export interface Dictionary<TItem> {
    [key: string]: TItem;
    [key: number]: TItem;
}

// tslint:disable-next-line:no-any
const BREAK: any = {};

export class Collection<TItem> {
    [index: number]: TItem | undefined;
    // public [Symbol.iterator]: Function;

    /**
     * Returning this in any enumerator will break the inner loop.
     */
    public static readonly BREAK = BREAK;
    /**
     * Returning this in any enumerator will break the inner loop.
     */
    public readonly BREAK = BREAK;

    // tslint:disable-next-line:variable-name
    protected _firstIndex = 0;

    public get firstIndex(): number {
        return this._firstIndex;
    }

    // tslint:disable-next-line:variable-name
    protected _lastIndex = 0;

    public get lastIndex(): number {
        return this._lastIndex;
    }

    // tslint:disable-next-line:variable-name
    protected _count = 0;

    public get count(): number {
        return this._count;
    }

    public constructor();
    public constructor(enumerable: StringDictionary<TItem>);
    public constructor(enumerable: NumberDictionary<TItem>);
    public constructor(enumerable?: Dictionary<TItem>) {
        if (enumerable) {
            Object.keys(enumerable).forEach(key => {
                this.append(enumerable[key]);
            });
        }

        makeNonEnumerable(this, 'BREAK', '_firstIndex', '_lastIndex', '_count');
    }

    public append(...items: TItem[]): Collection<TItem> {
        items.forEach(item => {
            this._lastIndex += 1;
            this._count += 1;

            this[this.lastIndex] = item;
        });

        return this;
    }

    public prepend(...items: TItem[]): Collection<TItem> {
        items.forEach(item => {
            this._firstIndex -= 1;
            this._count += 1;

            this[this.firstIndex] = item;
        });

        return this;
    }

    public remove(item: TItem): Collection<TItem> {
        const index = this.findIndex(item);

        if (index !== undefined) {
            this.delete(index);
        }

        return this;
    }

    public removeBy(remover: Remover<TItem>): Collection<TItem> {
        this.enumerate((item, index, collection) => {
            if (remover(item, index, collection)) {
                this.delete(index);
            }
        });

        return this;
    }

    public delete(index: number): Collection<TItem>;
    public delete(index: number, count: number): Collection<TItem>;
    public delete(index: number, count?: number): Collection<TItem> {
        if (typeof count === 'number') {
            let times = count;

            // @ts-ignore: Allow unused paramater
            this.enumerateFromWhile(index, () => times-- > 0, (item, i) => this.delete(i));
        } else {
            delete this[index];

            if (index === this.firstIndex) {
                this._firstIndex += 1;
            } else if (index === this.lastIndex) {
                this._lastIndex -= 1;
            }

            this._count -= 1;
        }

        return this;
    }

    public replace(item: TItem, replacement: TItem): Collection<TItem> {
        const index = this.findIndex(item);

        if (index !== undefined) {
            this[index] = replacement;
        }

        return this;
    }

    public replaceBy(replacer: Replacer<TItem>): Collection<TItem> {
        this.enumerate((item, index, collection) => {
            this[index] = replacer(item, index, collection);
        });

        return this;
    }

    public filter(filter?: Filter<TItem>): Collection<TItem> {
        if (filter) {
            const filteredCollection: Collection<TItem> = new Collection();

            this.enumerate((item, index, collection) => {
                if (filter(item, index, collection)) {
                    filteredCollection.append(item);
                }
            });

            return filteredCollection;
        } else {
            return this;
        }
    }

    public clear(): Collection<TItem> {
        this.removeBy(() => true);

        return this;
    }

    public first(filter?: Filter<TItem>): TItem | undefined {
        const collection = this.filter(filter);

        // @ts-ignore: Allow unused paramater
        return collection.find((item, index) => {
            return index in collection;
        });
    }

    public last(filter?: Filter<TItem>): TItem | undefined {
        const collection = this.filter(filter);

        // @ts-ignore: Allow unused paramater
        return collection.findLast((item, index) => {
            return index in collection;
        });
    }

    public single(filter?: Filter<TItem>): TItem {
        const collection = this.filter(filter);

        if (collection.count === 0) {
            throw new Error('The Collection is empty.');
        } else if (collection.count > 1) {
            throw new Error('The Collection contains more than one item.');
        } else {
            return <TItem>this.first();
        }
    }

    public enumerateBetween(firstIndex: number, lastIndex: number, enumerator: Enumerator<TItem, void>): void {
        for (let index = firstIndex; index <= lastIndex; index++) {
            if (index in this) {
                // tslint:disable-next-line:no-void-expression
                const result = enumerator(<TItem>this[index], index, this);

                if (result === BREAK) {
                    break;
                }
            }
        }
    }

    public enumerateFrom(firstIndex: number, enumerator: Enumerator<TItem, void>): void {
        this.enumerateBetween(firstIndex, this.lastIndex, enumerator);
    }

    public enumerateTo(lastIndex: number, enumerator: Enumerator<TItem, void>): void {
        this.enumerateBetween(this.firstIndex, lastIndex, enumerator);
    }

    public enumerate(enumerator: Enumerator<TItem, void>): void {
        this.enumerateBetween(this.firstIndex, this.lastIndex, enumerator);
    }

    public enumerateBetweenWhile(
        firstIndex: number,
        lastIndex: number,
        checker: Checker<TItem>,
        enumerator: Enumerator<TItem, void>
    ): void {
        this.enumerateBetween(firstIndex, lastIndex, (item, index, collection) => {
            if (checker(item, index, collection)) {
                enumerator(item, index, collection);
            } else {
                return BREAK;
            }
        });
    }

    public enumerateFromWhile(firstIndex: number, checker: Checker<TItem>, enumerator: Enumerator<TItem, void>): void {
        this.enumerateBetweenWhile(firstIndex, this.lastIndex, checker, enumerator);
    }

    public enumerateToWhile(lastIndex: number, checker: Checker<TItem>, enumerator: Enumerator<TItem, void>): void {
        this.enumerateBetweenWhile(this.firstIndex, lastIndex, checker, enumerator);
    }

    public enumerateWhile(checker: Checker<TItem>, enumerator: Enumerator<TItem, void>): void {
        this.enumerateBetweenWhile(this.firstIndex, this.lastIndex, checker, enumerator);
    }

    public enumerateBetweenReverse(lastIndex: number, firstIndex: number, enumerator: Enumerator<TItem, void>) {
        for (let index = lastIndex; index >= firstIndex; index--) {
            if (index in this) {
                // tslint:disable-next-line:no-void-expression
                const result = enumerator(<TItem>this[index], index, this);

                if (result === BREAK) {
                    break;
                }
            }
        }
    }

    public enumerateFromReverse(lastIndex: number, enumerator: Enumerator<TItem, void>): void {
        this.enumerateBetweenReverse(lastIndex, this.firstIndex, enumerator);
    }

    public enumerateToReverse(firstIndex: number, enumerator: Enumerator<TItem, void>): void {
        this.enumerateBetweenReverse(this.lastIndex, firstIndex, enumerator);
    }

    public enumerateReverse(enumerator: Enumerator<TItem, void>): void {
        this.enumerateBetweenReverse(this.lastIndex, this.firstIndex, enumerator);
    }

    public enumerateBetweenReverseWhile(
        lastIndex: number,
        firstIndex: number,
        checker: Checker<TItem>,
        enumerator: Enumerator<TItem, void>
    ): void {
        this.enumerateBetweenReverse(lastIndex, firstIndex, (item, index, collection) => {
            if (checker(item, index, collection)) {
                enumerator(item, index, collection);
            } else {
                return BREAK;
            }
        });
    }

    public enumerateFromReverseWhile(
        lastIndex: number,
        checker: Checker<TItem>,
        enumerator: Enumerator<TItem, void>
    ): void {
        this.enumerateBetweenReverseWhile(this.firstIndex, lastIndex, checker, enumerator);
    }

    public enumerateToReverseWhile(
        firstIndex: number,
        checker: Checker<TItem>,
        enumerator: Enumerator<TItem, void>
    ): void {
        this.enumerateBetweenReverseWhile(firstIndex, this.lastIndex, checker, enumerator);
    }

    public enumerateReverseWhile(checker: Checker<TItem>, enumerator: Enumerator<TItem, void>): void {
        this.enumerateBetweenReverseWhile(this.lastIndex, this.firstIndex, checker, enumerator);
    }

    public find(finder: Finder<TItem>): TItem | undefined {
        let result: TItem | undefined;

        this.enumerate((item, index, collection) => {
            const found = finder(item, index, collection);

            if (found) {
                result = item;

                return BREAK;
            }
        });

        return result;
    }

    public findLast(finder: Finder<TItem>): TItem | undefined {
        let result: TItem | undefined;

        this.enumerateReverse((item, index, collection) => {
            const found = finder(item, index, collection);

            if (found) {
                result = item;

                return BREAK;
            }
        });

        return result;
    }

    public findIndexBy(finder: Finder<TItem>): number | undefined {
        let result: number | undefined;

        this.enumerate((item, index, collection) => {
            const found = finder(item, index, collection);

            if (found) {
                result = index;

                return BREAK;
            }
        });

        return result;
    }

    public findIndex(item: TItem, strict?: boolean): number | undefined;
    public findIndex(toFind: TItem, strict = true): number | undefined {
        return strict ? this.findIndexBy(item => item === toFind) : this.findIndexBy(item => item === toFind);
    }

    public findLastIndexBy(finder: Finder<TItem>): number | undefined {
        let result: number | undefined;

        this.enumerateReverse((item, index, collection) => {
            const found = finder(item, index, collection);

            if (found) {
                result = index;

                return BREAK;
            }
        });

        return result;
    }

    public findLastIndex(item: TItem, strict?: boolean): number | undefined;
    public findLastIndex(toFind: TItem, strict = true): number | undefined {
        return strict ? this.findLastIndexBy(item => item === toFind) : this.findLastIndexBy(item => item === toFind);
    }

    public any(filter: Filter<TItem> = (item: TItem) => !!item): boolean {
        let result = false;

        this.enumerate((item, index, collection) => {
            if (filter(item, index, collection)) {
                result = true;

                return this.BREAK;
            }
        });

        return result;
    }

    public all(filter: Filter<TItem> = (item: TItem) => !!item): boolean {
        let result = true;

        this.enumerate((item, index, collection) => {
            if (!filter(item, index, collection)) {
                result = false;

                return this.BREAK;
            }
        });

        return result;
    }

    public toArray<TResult = TItem>(customiser?: Customiser<TItem, TResult>): TResult[] {
        const result: TResult[] = [];

        if (customiser) {
            this.enumerate((item, index, collection) => result.push(customiser(item, index, collection)));
        } else {
            this.enumerate(item => result.push(<TResult>(<{}>item)));
        }

        return result;
    }

    public toDictionary<TKey, TValue = TItem>(
        keyCustomiser: Customiser<TItem, TKey>,
        valueCustomiser?: Customiser<TItem, TValue>
    ): Dictionary<TValue> {
        const result = <Dictionary<TValue>>{};

        if (valueCustomiser) {
            this.enumerate((item, index, collection) => {
                const key = keyCustomiser(item, index, collection);
                const value = valueCustomiser(item, index, collection);

                // tslint:disable-next-line:no-any
                (<any>result)[key] = value;
            });
        } else {
            this.enumerate((item, index, collection) => {
                const key = keyCustomiser(item, index, collection);

                // tslint:disable-next-line:no-any
                (<any>result)[key] = item;
            });
        }

        return result;
    }

    public [Symbol.iterator](): IterableIterator<TItem> {
        return this.iterator();
    }

    public *iterator() {
        for (let index = this.firstIndex; index <= this.lastIndex; index++) {
            if (index in this) {
                yield <TItem>this[index];
            }
        }
    }
}

const originalAppend = Collection.prototype.append;
const originalPrepend = Collection.prototype.prepend;

function firstThenSwap<TItem>(instance: Collection<TItem>, items: TItem[], func: 'append' | 'prepend') {
    if (items.length > 0) {
        Object.defineProperties(instance, {
            append: {
                value: originalAppend,
                enumerable: false
            },
            prepend: {
                value: originalPrepend,
                enumerable: false
            }
        });

        if (func === 'append') {
            // tslint:disable-next-line:no-string-literal
            instance['_lastIndex'] = -1;
            instance.append(...items);
        } else {
            // tslint:disable-next-line:no-string-literal
            instance['_firstIndex'] = 1;
            instance.prepend(...items);
        }
    }

    return instance;
}

Object.defineProperties(Collection.prototype, {
    append: {
        value: function append<TItem>(this: Collection<TItem>, ...items: TItem[]): Collection<TItem> {
            return firstThenSwap(this, items, 'append');
        }
    },
    prepend: {
        value: function prepend<TItem>(this: Collection<TItem>, ...items: TItem[]): Collection<TItem> {
            return firstThenSwap(this, items, 'prepend');
        }
    }
});
