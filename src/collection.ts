import { makeNonEnumerable } from './utils';

export type Enumerator<TItem, TResult> = (item: TItem, index: number, collection: Collection<TItem>) => TResult;
export type Filter<TItem> = Enumerator<TItem, boolean>;
export type Remover<TItem> = Enumerator<TItem, boolean>;
export type Replacer<TItem> = Enumerator<TItem, TItem>;
export type Finder<TItem> = Enumerator<TItem, boolean>;
export type Customiser<TItem, TResult> = Enumerator<TItem, TResult>;

const SYMBOL = Symbol || { iterator: {} };

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

    public remove(item: TItem): Collection<TItem>;
    public remove(remover: Remover<TItem>): Collection<TItem>;
    public remove(index: number, count?: number): Collection<TItem>;
    public remove(indexOrItemOrRemover: number | TItem | Remover<TItem>, count?: number): Collection<TItem> {
        if (typeof indexOrItemOrRemover === 'number') {
            if (typeof count === 'number') {
                let times = count;

                this.enumerate((item, index) => {
                    this.remove(index);

                    if (times-- === 0) {
                        return BREAK;
                    }
                });
            } else {
                delete this[indexOrItemOrRemover];

                if (indexOrItemOrRemover === this.firstIndex) {
                    this._firstIndex += 1;
                } else if (indexOrItemOrRemover === this.lastIndex) {
                    this._lastIndex -= 1;
                }

                this._count -= 1;
            }
        } else if (typeof indexOrItemOrRemover === 'function') {
            this.enumerate((item, index, collection) => {
                if (indexOrItemOrRemover(item, index, collection)) {
                    this.remove(index);
                }
            });
        } else {
            const index = this.findIndex(indexOrItemOrRemover);

            if (index !== undefined) {
                this.remove(index);
            }
        }

        return this;
    }

    public replace(item: TItem, replacement: TItem): Collection<TItem>;
    public replace(index: number, replacement: TItem): Collection<TItem>;
    public replace(replacer: Replacer<TItem>): Collection<TItem>;
    public replace(
        indexOrItemOrReplacer: TItem | number | Replacer<TItem>,
        replacementOrUndefined?: TItem
    ): Collection<TItem> {
        if (typeof indexOrItemOrReplacer === 'number') {
            this[indexOrItemOrReplacer] = replacementOrUndefined;
        } else if (typeof indexOrItemOrReplacer === 'function') {
            this.enumerate((item, index, collection) => {
                this[index] = indexOrItemOrReplacer(item, index, collection);
            });
        } else {
            const index = this.findIndex(indexOrItemOrReplacer);

            if (index !== undefined) {
                this.replace(index, <TItem>replacementOrUndefined);
            }
        }

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

    public first(filter?: Filter<TItem>): TItem | undefined {
        const collection = this.filter(filter);

        return collection.find((item, index) => {
            return index in collection;
        });
    }

    public last(filter?: Filter<TItem>): TItem | undefined {
        const collection = this.filter(filter);

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

    public enumerate(enumerator: Enumerator<TItem, void>): void {
        for (let index = this.firstIndex; index <= this.lastIndex; index++) {
            if (index in this) {
                // tslint:disable-next-line:no-void-expression
                const result = enumerator(<TItem>this[index], index, this);

                if (result === BREAK) {
                    break;
                }
            }
        }
    }

    public enumerateReverse(enumerator: Enumerator<TItem, void>): void {
        for (let index = this.lastIndex; index >= this.firstIndex; index--) {
            if (index in this) {
                // tslint:disable-next-line:no-void-expression
                const result = enumerator(<TItem>this[index], index, this);

                if (result === BREAK) {
                    break;
                }
            }
        }
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

    public *[SYMBOL.iterator]() {
        const keys = Object.keys(this).map(key => +key);

        for (const key of keys) {
            yield <TItem>this[key];
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
