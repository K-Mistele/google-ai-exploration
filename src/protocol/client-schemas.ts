/**
 * This file provides zod schemas for client messages (sent from client to server) for
 * Google's Gemini flash 2.0 websocket messages.
 * See https://ai.google.dev/api/multimodal-live#integration-guide for details.
 */
import z from 'zod'
import {type JsonSchema7ObjectType, zodToJsonSchema} from 'zod-to-json-schema'
import type {Content, FunctionCall, GenerationConfig, GenerativeContentBlob, Part, Tool} from '@google/generative-ai'
import {
    serverContentMessageSchema,
    setupCompleteMessageSchema,
    toolCallCancellationMessageSchema,
    toolCallMessageSchema
} from './server-schemas'


/**
 * Schema for a function definition; created using {@link toGeminiFlashRealtimeTool}
 */
export const functionDeclaration = z.object({
    name: z.string(),
    description: z.string(),
    parameters: z.custom<JsonSchema7ObjectType>()
})
export type GoogleGeminiFunctionDeclarationInput = z.input<typeof functionDeclaration>
export type GoogleGeminiFunctionDeclaration = z.infer<typeof functionDeclaration>

/**
 * Schema for a data blob which includes a mime type and base64-encoded data
 */
export const blobSchema = z.object({
    mimeType: z.string(),
    data: z.string().describe('base64-encoded')
})

/**
 * Schemas for various types of "parts" of conversations including text, tool calls etc.
 */
export const textPartSchema = z.object({
    text: z.string()
})
export const inlineDataPartSchema = z.object({
    inlineData: blobSchema
})
export const functionCallPartSchema = z.object({
    functionCall: z.object({
        name: z.string(),
        args: z.any()
    })
})
export const functionResponsePartSchema = z.object({
    functionResponse: z.object({
        name: z.string(),
        response: z.any()
    })
})
export const fileDataPartSchema = z.object({
    fileData: z.object({
        mimeType: z.string(),
        fileUri: z.string()
    })
})
export const executableCodePartSchema = z.object({
    executableCode: z.object({
        language: z.enum(['PYTHON', 'LANGUAGE_UNSPECIFIED']),
        code: z.string()
    })
})
export const codeExecutionResultPartSchema = z.object({
    executableCode: z.object({
        outcome: z.enum(['OUTCOME_UNSPECIFIED', "OUTCOME_OK", "OUTCOME_FAILED", "OUTCOME_DEADLINE_EXCEEDED"]),
        output: z.string()
    })
})

/**
 * Combined union representing all possible Part types
 */
export const partSchema = z.union([
    textPartSchema,
    inlineDataPartSchema,
    functionCallPartSchema,
    functionResponsePartSchema,
    fileDataPartSchema,
    executableCodePartSchema,
    codeExecutionResultPartSchema
])
export const contentSchema = z.object({
    parts: z.array(partSchema),
    role: z.enum(['user', 'model']),
})

export const liveConfigSchema =z.object({
    model: z.string().default('gemini-2.0-flash-exp'),
    systemInstruction: z.object({
        parts: partSchema
    }).optional(),
    generationConfig: z.object({}).optional(),
    tools: z.array(z.union([
        z.object({
            functionDeclarations: z.array(functionDeclaration).default([]),
        }),
        z.object({
            googleSearch: z.object({})
        }),
        z.object({
            codeExecution: z.object({})
        })
    ])).optional()
})
export type LiveConfig = z.infer<typeof liveConfigSchema>
export type LiveConfigInput = z.input<typeof liveConfigSchema>

export const voiceSchema = z.enum(['Puck', 'Charon', 'Lore', 'Fenrir', 'Aoede'])
export const liveGenerationConfigSchema = z.intersection(
    z.custom<GenerationConfig>(),
    z.object({
        responseModalities: z.enum(['text', 'audio', 'image']),
        speechConfig: z.object({
            voiceConfig: z.object({
                prebuiltVoiceConfig: z.object({
                    voiceName: voiceSchema
                }).optional()
            }).optional()
        }).optional()
    }).default({responseModalities: 'text', speechConfig: {voiceConfig: {prebuiltVoiceConfig: {voiceName: 'Aoede'}}}})
)

export type LiveGenerationConfig = z.infer<typeof liveGenerationConfigSchema>
export type LiveGenerationInput = z.input<typeof liveGenerationConfigSchema>

/**
 * Only use this when we need to send text, shouldn't be used
 */
export const clientContentSchema = z.object({
    turns: z.array(contentSchema),
    turn_complete: z.boolean()
})

/**
 * Use this for sending audio
 */

export const setupMessageSchema = z.object({
    setup: liveConfigSchema
})
export type SetupMessage = z.infer<typeof setupMessageSchema>
export type SetupMessageInput = z.infer<typeof setupMessageSchema>


export const clientContentMessageSchema = z.object({
    clientContent: z.object({
        turns: z.array(contentSchema),
        turnComplete: z.boolean()
    })
})
export type ClientContentMessage = z.infer<typeof clientContentMessageSchema>
export type ClientContentMessageInput = z.input<typeof clientContentMessageSchema>


export const realtimeInputMessageSchema = z.object({
    realtimeInput: z.object({
        mediaChunks: blobSchema
    })
})
export type RealtimeInputMessage = z.infer<typeof realtimeInputMessageSchema>
export type RealtimeInputMessageInput = z.input<typeof realtimeInputMessageSchema>

export const liveFunctionResponseSchema = z.object({
    response: z.any(),
    id: z.string()
})
export type LiveFunctionResponse = z.infer<typeof liveFunctionResponseSchema>
export type LiveFunctionResponseInput = z.input<typeof liveFunctionResponseSchema>

export const toolResponseMessageSchema = z.object({
    toolResponse: z.object({
        functionResponses: z.array(liveFunctionResponseSchema)
    })
})
export type ToolResponseMessage = z.infer<typeof toolResponseMessageSchema>
export type ToolResponseMessageInput = z.input<typeof toolResponseMessageSchema>
export type ToolResponse = ToolResponseMessage['toolResponse']

export const liveOutgoingMessageSchema = z.union([
    setupMessageSchema,
    clientContentSchema,
    realtimeInputMessageSchema,
    toolResponseMessageSchema
])
    .transform((data) => {
        if ('setup' in data) return setupMessageSchema.parse(data);
        if ('clientContent' in data) return clientContentMessageSchema.parse(data);
        if ('realtimeInput' in data) return realtimeInputMessageSchema.parse(data);
        if ('toolResponse' in data) return toolResponseMessageSchema.parse(data);
        throw new Error('Invalid message format');
    });
export type LiveOutgoingMessage = z.infer<typeof liveOutgoingMessageSchema>
export type LiveOutgoingMessageInput = z.input<typeof liveOutgoingMessageSchema>


export function toGeminiFlashRealtimeTool(params: {
    name: string,
    description: string,
    parameters: z.ZodTypeAny
}): GoogleGeminiFunctionDeclaration {
    return  functionDeclaration.parse({
        name: params.name,
        description: params.description,
        // @ts-expect-error - convert the params zod object into a JSON schema like google expects
        parameters: zodToJsonSchema( params.parameters)

    } satisfies GoogleGeminiFunctionDeclarationInput)
}