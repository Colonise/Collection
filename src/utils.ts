export function NonEnumerable<T>(target: T, propertyKey: string) {
    Object.defineProperty(target, propertyKey, <PropertyDescriptor>{
        configurable: true,
        enumerable: false,
        writable: true
    });
}
