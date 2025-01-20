import {
    type LiveConfig,
    type LiveOutgoingMessage,
    type SetupMessage,
    type SetupMessageInput,
    setupMessageSchema
} from './protocol/client-schemas'
import {type RawData, WebSocket} from 'ws'
import {parseWebsocketMessage, requireEnvironment} from './utils'
import {type LiveIncomingMessage, liveIncomingMessageSchema} from './protocol/server-schemas'

const GOOGLE_API_KEY = requireEnvironment(`GOOGLE_API_KEY`)


export class GeminiFlash2MultimodalClient {

    private connectionUrl: string
    private config: LiveConfig
    private ws: WebSocket | null = null


    constructor() {
        this.connectionUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${GOOGLE_API_KEY}`

        this.config = {
            model: `models/gemini-2.0-flash-exp`
        }

        this.ws = this.getConnection(this.connectionUrl)

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

    protected async handleOutboundMessageFromGoogle(data: RawData | string, isBinary: boolean) {

        const event = parseWebsocketMessage(data, isBinary)
        if (!event) return

        const message = liveIncomingMessageSchema.parse(event)
        console.log(`Received message:`, message)


        // TODO process different event types
    }
}