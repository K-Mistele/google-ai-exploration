import type {
    LiveFunctionResponse,
    LiveOutgoingMessage, SetupMessage, ToolResponse
} from './client-schemas.ts'
import type {
    Interrupted,
    LiveFunctionCall,
    LiveIncomingMessage,
    ModelTurn,
    ToolCall, ToolCallCancellationMessage,
    TurnComplete
} from './server-schemas.ts'

/**
 * Type-safe runtime assertion that a property is present and defined as an object, on a given object
 * @param a
 * @param prop
 * @param kind
 */
export const prop = (a: any, prop: string, kind: string = 'object') =>
    typeof a === 'object' && typeof a[prop] === kind


export const isSetupMessage = (a: unknown): a is SetupMessage =>
    prop(a, "setup");

export const isClientContentMessage = (a: unknown): a is LiveOutgoingMessage =>
    prop(a, "clientContent");

export const isRealtimeInputMessage = (a: unknown): a is LiveOutgoingMessage =>
    prop(a, "realtimeInput");

export const isToolResponseMessage = (a: unknown): a is LiveOutgoingMessage =>
    prop(a, "toolResponse");

// incoming messages
export const isSetupCompleteMessage = (a: unknown): a is LiveIncomingMessage =>
    prop(a, "setupComplete");

export const isServerContentMessage = (a: any): a is LiveIncomingMessage =>
    prop(a, "serverContent");

export const isToolCallMessage = (a: any): a is LiveIncomingMessage =>
    prop(a, "toolCall");

export const isToolCallCancellationMessage = (
    a: unknown,
): a is LiveIncomingMessage =>
    prop(a, "toolCallCancellation") &&
    isToolCallCancellation((a as any).toolCallCancellation);

export const isModelTurn = (a: any): a is ModelTurn =>
    typeof (a as ModelTurn).modelTurn === "object";

export const isTurnComplete = (a: any): a is TurnComplete =>
    typeof (a as TurnComplete).turnComplete === "boolean";

export const isInterrupted = (a: any): a is Interrupted =>
    (a as Interrupted).interrupted;

export function isToolCall(value: unknown): value is ToolCall {
    if (!value || typeof value !== "object") return false;

    const candidate = value as Record<string, unknown>;

    return (
        Array.isArray(candidate.functionCalls) &&
        candidate.functionCalls.every((call) => isLiveFunctionCall(call))
    );
}

export function isToolResponse(value: unknown): value is ToolResponse {
    if (!value || typeof value !== "object") return false;

    const candidate = value as Record<string, unknown>;

    return (
        Array.isArray(candidate.functionResponses) &&
        candidate.functionResponses.every((resp) => isLiveFunctionResponse(resp))
    );
}

export function isLiveFunctionCall(value: unknown): value is LiveFunctionCall {
    if (!value || typeof value !== "object") return false;

    const candidate = value as Record<string, unknown>;

    return (
        typeof candidate.name === "string" &&
        typeof candidate.id === "string" &&
        typeof candidate.args === "object" &&
        candidate.args !== null
    );
}

export function isLiveFunctionResponse(
    value: unknown,
): value is LiveFunctionResponse {
    if (!value || typeof value !== "object") return false;

    const candidate = value as Record<string, unknown>;

    return (
        typeof candidate.response === "object" && typeof candidate.id === "string"
    );
}

export const isToolCallCancellation = (
    a: unknown,
): a is ToolCallCancellationMessage["toolCallCancellation"] =>
    typeof a === "object" && Array.isArray((a as any).ids);