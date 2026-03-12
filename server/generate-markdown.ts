import type { IncomingMessage, ServerResponse } from 'node:http'
import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import {
  directiveComponentRegistry,
  getDirectiveGenerationGuide,
  validateDirectiveStructure,
} from '../src/components/markdown-with-directive/components/markdown-with-directive-schema'

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'
const DIRECTIVE_NAME_REGEX = /:{2,}([A-Za-z][\w-]*)/g
const MAX_GENERATION_ATTEMPTS = 2

const requestSchema = z.object({
  imageDataUrl: z
    .string()
    .min(1)
    .regex(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, 'imageDataUrl must be a base64 data URL'),
  mimeType: z.string().regex(/^image\/[a-zA-Z0-9.+-]+$/, 'mimeType must be an image media type'),
})

const generatedMarkdownSchema = z.object({
  title: z.string().min(1).max(80),
  markdown: z.string().min(1).max(12000),
})

function getGeminiModel() {
  return process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL
}

function assertApiKey() {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY)
    throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY')
}

function estimateImageSize(dataUrl: string) {
  const base64 = dataUrl.split(',', 2)[1] ?? ''
  return Math.ceil(base64.length * 3 / 4)
}

function convertDataUrlToUint8Array(dataUrl: string) {
  const [, base64 = ''] = dataUrl.split(',', 2)
  return new Uint8Array(Buffer.from(base64, 'base64'))
}

function sanitizeGeneratedMarkdown(markdown: string) {
  return markdown
    .trim()
    .replace(/^```(?:markdown)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
}

function assertAllowedDirectives(markdown: string) {
  const allowedDirectiveNames = new Set(
    Object.values(directiveComponentRegistry).map(item => item.directiveName.toLowerCase()),
  )
  const foundDirectiveNames = [...markdown.matchAll(DIRECTIVE_NAME_REGEX)]
    .map(match => match[1])
    .filter(Boolean)

  const disallowed = foundDirectiveNames.filter(name =>
    !allowedDirectiveNames.has(name.toLowerCase()),
  )

  if (disallowed.length > 0)
    throw new Error(`Generated markdown contains unsupported directives: ${[...new Set(disallowed)].join(', ')}`)
}

function getSystemPrompt(previousAttemptError?: string) {
  return [
    'You convert an input image into Markdown content.',
    'Return only structured data that matches the requested schema.',
    'The markdown must faithfully describe the uploaded image and can be written in Chinese.',
    'You may use plain Markdown freely.',
    'Do not use any other custom component, raw HTML, JSX, MDX, or fenced code blocks.',
    'Do not invent unsupported attributes.',
    'Keep the markdown concise, structured, and ready to render.',
    getDirectiveGenerationGuide(),
    previousAttemptError
      ? `The previous attempt failed validation. You must fix this specific error: ${previousAttemptError}`
      : '',
  ].join(' ')
}

export async function generateMarkdownFromImage(input: unknown) {
  assertApiKey()

  const payload = requestSchema.parse(input)
  if (estimateImageSize(payload.imageDataUrl) > MAX_IMAGE_SIZE_BYTES)
    throw new Error('Image is too large. Please upload an image smaller than 5MB.')

  const imageData = convertDataUrlToUint8Array(payload.imageDataUrl)

  let previousAttemptError: string | undefined

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const { object } = await generateObject({
      model: google(getGeminiModel()),
      schema: generatedMarkdownSchema,
      temperature: 0.2,
      system: getSystemPrompt(previousAttemptError),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: [
                'Analyze the uploaded image and convert it into markdown.',
                'Keep the output faithful to visible content.',
                'Title should be short and descriptive.',
                'Markdown may use normal markdown and the allowed directives only.',
                'If you use nested directives, make the parent use more colons than the child and use exactly matching closing fences.',
              ].join(' '),
            },
            {
              type: 'file',
              data: imageData,
              mediaType: payload.mimeType,
            },
          ],
        },
      ],
    })

    const result = {
      title: object.title.trim(),
      markdown: sanitizeGeneratedMarkdown(object.markdown),
    }

    try {
      assertAllowedDirectives(result.markdown)
      const structureValidation = validateDirectiveStructure(result.markdown)
      if (!structureValidation.valid)
        throw new Error(structureValidation.message)

      return result
    }
    catch (error) {
      previousAttemptError = error instanceof Error ? error.message : 'Generated markdown failed validation.'
      if (attempt === MAX_GENERATION_ATTEMPTS - 1)
        throw error
    }
  }

  throw new Error('Failed to generate valid markdown.')
}

function readRequestBody(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []

    req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function writeJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

export async function handleGenerateMarkdownDevRequest(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method !== 'POST') {
    writeJson(res, 405, { error: 'Method not allowed' })
    return
  }

  try {
    const rawBody = await readRequestBody(req)
    const json = rawBody ? JSON.parse(rawBody) : {}
    const result = await generateMarkdownFromImage(json)
    writeJson(res, 200, result)
  }
  catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate markdown'
    const statusCode = error instanceof z.ZodError ? 400 : 500
    writeJson(res, statusCode, { error: message })
  }
}
