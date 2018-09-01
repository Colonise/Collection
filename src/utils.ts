export function makeNonEnumerable<T>(instance: T, ...keys: string[]) {
    keys.forEach(key => {
        const descriptor = Object.getOwnPropertyDescriptor(instance, key) || {};

        descriptor.enumerable = false;

        Object.defineProperty(instance, key, descriptor);
    });
}
