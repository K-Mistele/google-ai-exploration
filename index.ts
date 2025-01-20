/**
 * Note that the API supports the following audio formats:
 * Input audio format: Raw 16 bit PCM audio at 16kHz little-endian
 * Output audio format: Raw 16 bit PCM audio at 24kHz little-endian
 *
 * NOTE that there is a limit of 3 concurrent sessions PER API KEY, with 4M tokens per minute.
 * THis means we probably need to do API key rotation until we're on google vertex AI
 */
import {GoogleGenerativeAI, HarmBlockThreshold, HarmCategory} from '@google/generative-ai'

if (!process.env.GOOGLE_API_KEY) throw new Error(`Missing google API key!`)
const genAi = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)

const model = genAi.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    systemInstruction: 'You are a helpful assistant. Answer all questions from the user to the best of your ability, ' +
        'and follow all instructions given to you.',
    safetySettings: [
        {category: HarmCategory.HARM_CATEGORY_UNSPECIFIED, threshold: HarmBlockThreshold.BLOCK_NONE},
        {category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE},
        {category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE},
        {category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE}
    ]
})

// TODO make sure to handle message events which may be blobs for audio / video, otherwise data:
/*
 ws.addEventListener("message", async (evt) => {
 if (evt.data instanceof Blob) {
 // Process the received data (audio, video, etc.)
 } else {
 // Process JSON response
 }
 });
 */


const prompt = 'tell me a joke.'
const result = await model.generateContent([prompt],)

console.log({
    text: result.response.text(),
    functionCalls: result.response.functionCalls()
})