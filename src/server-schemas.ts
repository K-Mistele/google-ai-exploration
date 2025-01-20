/**
 * This file provides zod schemas for server messages (sent from server to client) for
 * Google's Gemini flash 2.0 websocket messages.
 * See https://ai.google.dev/api/multimodal-live#integration-guide for details.
 */
import z, {boolean} from 'zod'
import {partSchema} from './client-schemas.ts'

/**
 * Schemas and types for incoming messages
 */
export const toolCallCancellationMessageSchema = z.object({
    toolCallCancellation: z.object({
        ids: z.array(z.string())
    })
})

export type ToolCallCancellationMessage = z.infer<typeof toolCallCancellationMessageSchema>
export type ToolCallCancellationMessageInput = z.input<typeof toolCallCancellationMessageSchema>
export type ToolCallCancellation = ToolCallCancellationMessage['toolCallCancellation']

export const functionCallSchema = z.object({
    name: z.string(),
    args: z.any()
})
export type FunctionCall = z.infer<typeof functionCallSchema>
export type FunctionCallInput = z.input<typeof functionCallSchema>

export const liveFunctionCallSchema = z.intersection(
    functionCallSchema,
    z.object({
        id: z.string()
    })
)
export type LiveFunctionCall = z.infer<typeof liveFunctionCallSchema>
export type LiveFunctionCallInput = z.infer<typeof liveFunctionCallSchema>

export const toolCallSchema = z.object({
    functionCalls: z.array(liveFunctionCallSchema)
})
export type ToolCall = z.infer<typeof toolCallSchema>
export type ToolCallInput = z.infer<typeof toolCallSchema>

export const toolCallMessageSchema = z.object({
    toolCall: toolCallSchema
})
export type ToolCallMessage = z.infer<typeof toolCallMessageSchema>
export type ToolCallMessageInput = z.input<typeof toolCallMessageSchema>

export const modelTurnSchema = z.object({
    modelTurn: z.object({
        parts: z.array(partSchema)
    })
})
export type ModelTurn = z.infer<typeof modelTurnSchema>
export type ModelTurnInput = z.input<typeof modelTurnSchema>

export const turnCompleteSchema = z.object({
    turnComplete: z.boolean()
})
export type TurnComplete = z.infer<typeof turnCompleteSchema>
export type TurnCompleteInput = z.input<typeof turnCompleteSchema>

export const interruptedSchema = z.object({
    interrupted: z.literal(true)
})
export type Interrupted = z.infer<typeof interruptedSchema>
export type InterruptedInput = z.input<typeof interruptedSchema>


export const serverContentMessageSchema = z.object({
    serverContent: z.union([modelTurnSchema, turnCompleteSchema, interruptedSchema])
})

export type ServerContentMessage = z.infer<typeof serverContentMessageSchema>
export type ServerContentMessageInput = z.input<typeof serverContentMessageSchema>

export const setupCompleteMessageSchema = z.object({
    setupComplete: z.object({})
})
export type SetupCompleteMessage = z.infer<typeof setupCompleteMessageSchema>
export type SetupCompleteMessageInput = z.input<typeof setupCompleteMessageSchema>

export const liveIncomingMessageSchema = z.union([
    toolCallCancellationMessageSchema,
    toolCallMessageSchema,
    serverContentMessageSchema,
    setupCompleteMessageSchema
])
export type LiveIncomingMessage = z.infer<typeof liveIncomingMessageSchema>
export type LiveIncomingMessageInput = z.input<typeof liveIncomingMessageSchema>







