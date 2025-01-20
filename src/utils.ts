import type {RawData} from 'ws'
import z from 'zod'

/**
 * Retrieves a value from process.env or throws an exception if not found.
 * @param {string} key - The environment variable key to look up.
 * @returns {string} The value of the environment variable.
 * @throws {Error} If the environment variable is not set.
 */
export function requireEnvironment(key: string) {
    const value = process.env[key];
    if (value === undefined) {
        throw new Error(`Required environment variable "${key}" is not set.`);
    }
    return value;
}

/**
 * Receive a websocket message and convert it into a JSONObject
 * @param data
 * @param isBinary
 */
export function parseWebsocketMessage(
    data: RawData | Buffer | string,
    isBinary: boolean
): JSONObject | null{
    try {
        if (isBinary) data = data.toString()
        return JSON.parse(data.toString())
    }
    catch (err: any) {
        console.error(`Invalid websocket data:`, err)
        return null
    }
}

export type JSONValue =
    | null
    | string
    | number
    | boolean
    | {
    [value: string]: JSONValue
}
    | Array<JSONValue>
export const jsonValueSchema: z.ZodType<JSONValue> = z.lazy(() => z.union([
    z.null(),
    z.string(),
    z.number(),
    z.boolean(),
    z.record(jsonValueSchema),
    z.array(jsonValueSchema)
]))

export type JSONObject = {[key: string]: JSONValue}

export function createResolvablePromise<T>(): {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
} {
    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve: resolve!, reject: reject! };
}
