/**
 * Note that the API supports the following audio formats:
 * Input audio format: Raw 16 bit PCM audio at 16kHz little-endian
 * Output audio format: Raw 16 bit PCM audio at 24kHz little-endian
 *
 * NOTE that there is a limit of 3 concurrent sessions PER API KEY, with 4M tokens per minute.
 * THis means we probably need to do API key rotation until we're on google vertex AI
 */
import {GoogleGenerativeAI, HarmBlockThreshold, HarmCategory} from '@google/generative-ai'
import {GeminiFlash2MultimodalClient} from './src/client'
import Speaker from 'speaker'

const speaker = new Speaker({
    channels: 1,
    bitDepth: 16,
    sampleRate: 24_000,
})

if (!process.env.GOOGLE_API_KEY) throw new Error(`Missing google API key!`)
const genAi = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)

const client = new GeminiFlash2MultimodalClient()
