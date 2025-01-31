import {
    type ClientContentMessage,
    type LiveConfig,
    type LiveOutgoingMessage, type LiveOutgoingMessageInput, liveOutgoingMessageSchema, type RealtimeInputMessage,
    type SetupMessage,
    type SetupMessageInput,
    setupMessageSchema, type ToolResponseMessage
} from './protocol/client-schemas'
import {type RawData, WebSocket} from 'ws'
import {createResolvablePromise, parseWebsocketMessage, requireEnvironment} from './utils'
import {type LiveIncomingMessage, liveIncomingMessageSchema, type ServerContentMessage} from './protocol/server-schemas'
import {isServerContentMessage, isSetupCompleteMessage} from './protocol/type-guards'
import Speaker from 'speaker'
import {Readable} from 'node:stream'

const speaker = new Speaker({
    bitDepth: 16,
    channels: 1,
    sampleRate: 24_000,
})

const GOOGLE_API_KEY = requireEnvironment(`GOOGLE_API_KEY`)


export class GeminiFlash2MultimodalClient {

    public readonly ready: Promise<boolean>
    private connectionUrl: string
    private config: LiveConfig
    private ws: WebSocket | null = null
    private resolve: (a: boolean) => void
    private reject: (e: Error) => void

    constructor() {
        this.connectionUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${GOOGLE_API_KEY}`

        this.config = {
            model: `models/gemini-2.0-flash-exp`
        }

        this.ws = this.getConnection(this.connectionUrl)
        const {promise, resolve, reject} = createResolvablePromise<boolean>()
        this.ready = promise
        this.resolve = resolve
        this.reject = reject

    }

    public getConnection(url: string) {
        const ws = new WebSocket(this.connectionUrl)
        ws.on('message', async (data: RawData, isBinary: boolean) => await this.handleOutboundMessageFromGoogle(data, isBinary))
        ws.on('error', (err: Error) => {
            console.error(`Websocket error: `, err)
            ws.close()
        })
        ws.on('open', () => {
            if (!this.config) {
                console.error(`invalid config received`)
                return
            }

            // Send the setup message
            const setupMessage = setupMessageSchema.parse({
                setup: this.config
            } satisfies SetupMessageInput)
            ws.send(JSON.stringify(setupMessage))
        })
        ws.on('close', (code: number, reason: Buffer) => {
            console.info(`Websocket closed with code ${code} and reason ${reason.toString()}`)
            this.ws = null;
        })

        return ws
    }

    public async sendMessageToGoogle(message: LiveOutgoingMessageInput) {
        if (!this.ws) {
            console.error(`unable to send message as there is not a websocket yet`)
            return
        }
        this.ws.send(JSON.stringify(liveOutgoingMessageSchema.parse(message)))
    }

    protected async handleOutboundMessageFromGoogle(data: RawData | string, isBinary: boolean) {
        console.log(`received message:`, data.toString())
        const event = parseWebsocketMessage(data, isBinary)
        if (!event) return

        const message = liveIncomingMessageSchema.parse(event)
        if (isSetupCompleteMessage(message)) {
            console.log(`Setup complete`)
            this.resolve(true)
        }
        else if (isServerContentMessage(message)) {
            const a = message as ServerContentMessage
            const b = a.serverContent
            if ('modelTurn' in b) {
                const c = b.modelTurn.parts[0]
                if ('inlineData' in c) {

                    const audioString = c.inlineData.data
                    const audio = Buffer.from(audioString, 'base64')
                    const rs = Readable.from(audio)
                    rs.pipe(speaker, {end: false})


                }
            }
        }


        // TODO process different event types
    }
}