import { ZodError } from 'zod'
import { generateMarkdownFromImage } from '../server/generate-markdown'

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const result = await generateMarkdownFromImage(json)
    return jsonResponse(result)
  }
  catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate markdown'
    const status = error instanceof ZodError ? 400 : 500
    return jsonResponse({ error: message }, status)
  }
}
