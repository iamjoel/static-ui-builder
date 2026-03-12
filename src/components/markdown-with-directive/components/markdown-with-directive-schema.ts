import * as z from 'zod'
import calloutPrompt from './callout/prompt.json'
import compareCardPrompt from './compare-card/prompt.json'
import compareCardsPrompt from './compare-cards/prompt.json'
import featureGridPrompt from './feature-grid/prompt.json'
import featureItemPrompt from './feature-item/prompt.json'
import statCardPrompt from './stat-card/prompt.json'
import statsCardsPrompt from './stats-cards/prompt.json'
import withIconCardItemPrompt from './with-icon-card-item/prompt.json'
import withIconCardListPrompt from './with-icon-card-list/prompt.json'

const commonSchema = {
  className: z.string().min(1).optional(),
}
export const withIconCardListPropsSchema = z.object(commonSchema).strict()

const HTTP_URL_REGEX = /^https?:\/\//i

export const calloutPropsSchema = z.object({
  ...commonSchema,
  icon: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).optional(),
  tone: z.enum(['info', 'success', 'warning', 'error']).optional(),
}).strict()

export const featureGridPropsSchema = z.object({
  ...commonSchema,
  columns: z.enum(['2', '3', '4']).optional(),
}).strict()

export const featureItemPropsSchema = z.object({
  ...commonSchema,
  icon: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).optional(),
}).strict()

export const statsCardsPropsSchema = z.object({
  ...commonSchema,
  columns: z.enum(['2', '3', '4']).optional(),
}).strict()

export const statCardPropsSchema = z.object({
  ...commonSchema,
  hint: z.string().trim().min(1).optional(),
  label: z.string().trim().min(1).optional(),
  trend: z.enum(['up', 'down', 'neutral']).optional(),
  value: z.string().trim().min(1).optional(),
}).strict()

export const compareCardsPropsSchema = z.object({
  ...commonSchema,
  columns: z.enum(['2', '3']).optional(),
}).strict()

export const compareCardPropsSchema = z.object({
  ...commonSchema,
  badge: z.string().trim().min(1).optional(),
  highlight: z.enum(['true', 'false']).optional(),
  title: z.string().trim().min(1).optional(),
}).strict()

export const withIconCardItemPropsSchema = z.object({
  ...commonSchema,
  icon: z.string().trim().url().refine(
    value => HTTP_URL_REGEX.test(value),
    'icon must be a http/https URL',
  ),
}).strict()

export const directivePropsSchemas = {
  callout: calloutPropsSchema,
  comparecard: compareCardPropsSchema,
  comparecards: compareCardsPropsSchema,
  featuregrid: featureGridPropsSchema,
  featureitem: featureItemPropsSchema,
  statcard: statCardPropsSchema,
  statscards: statsCardsPropsSchema,
  withiconcardlist: withIconCardListPropsSchema,
  withiconcarditem: withIconCardItemPropsSchema,
} as const

type DirectiveRegistryEntry = {
  allowedAttributes: string[]
  blockKind: 'container' | 'leaf'
  description: string
  directiveName: string
  fewShotExamples: Array<{
    intent: string
    markdown: string
  }>
  generationNotes: string[]
  uiDescription: string
  useCases: string[]
}

const directivePromptRegistry = {
  callout: calloutPrompt,
  comparecard: compareCardPrompt,
  comparecards: compareCardsPrompt,
  featuregrid: featureGridPrompt,
  featureitem: featureItemPrompt,
  statcard: statCardPrompt,
  statscards: statsCardsPrompt,
  withiconcardlist: withIconCardListPrompt,
  withiconcarditem: withIconCardItemPrompt,
} as const satisfies Record<keyof typeof directivePropsSchemas, Omit<DirectiveRegistryEntry, 'allowedAttributes' | 'blockKind' | 'directiveName'>>

export const directiveComponentRegistry: Record<keyof typeof directivePropsSchemas, DirectiveRegistryEntry> = {
  callout: {
    directiveName: 'callout',
    blockKind: 'container',
    allowedAttributes: ['tone', 'title', 'icon', 'className'],
    ...directivePromptRegistry.callout,
  },
  comparecards: {
    directiveName: 'compareCards',
    blockKind: 'container',
    allowedAttributes: ['columns', 'className'],
    ...directivePromptRegistry.comparecards,
  },
  comparecard: {
    directiveName: 'compareCard',
    blockKind: 'container',
    allowedAttributes: ['title', 'badge', 'highlight', 'className'],
    ...directivePromptRegistry.comparecard,
  },
  featuregrid: {
    directiveName: 'featureGrid',
    blockKind: 'container',
    allowedAttributes: ['columns', 'className'],
    ...directivePromptRegistry.featuregrid,
  },
  featureitem: {
    directiveName: 'featureItem',
    blockKind: 'container',
    allowedAttributes: ['title', 'icon', 'className'],
    ...directivePromptRegistry.featureitem,
  },
  statscards: {
    directiveName: 'statsCards',
    blockKind: 'container',
    allowedAttributes: ['columns', 'className'],
    ...directivePromptRegistry.statscards,
  },
  statcard: {
    directiveName: 'statCard',
    blockKind: 'container',
    allowedAttributes: ['label', 'value', 'hint', 'trend', 'className'],
    ...directivePromptRegistry.statcard,
  },
  withiconcardlist: {
    directiveName: 'withIconCardList',
    blockKind: 'container',
    allowedAttributes: ['className'],
    ...directivePromptRegistry.withiconcardlist,
  },
  withiconcarditem: {
    directiveName: 'withIconCardItem',
    blockKind: 'container',
    allowedAttributes: ['icon', 'className'],
    ...directivePromptRegistry.withiconcarditem,
  },
}

export const directiveAllowedTags = Object.fromEntries(
  Object.entries(directiveComponentRegistry).map(([name, definition]) => [name, definition.allowedAttributes]),
) as Record<DirectiveName, string[]>

export type DirectiveName = keyof typeof directivePropsSchemas

function isDirectiveName(name: string): name is DirectiveName {
  return Object.hasOwn(directivePropsSchemas, name)
}

export function validateDirectiveProps(name: string, attributes: Record<string, string>): boolean {
  if (!isDirectiveName(name)) {
    console.error('[markdown-with-directive] Unknown directive name.', {
      attributes,
      directive: name,
    })
    return false
  }

  const parsed = directivePropsSchemas[name].safeParse(attributes)
  if (!parsed.success) {
    console.error('[markdown-with-directive] Invalid directive props.', {
      attributes,
      directive: name,
      issues: parsed.error.issues.map(issue => ({
        code: issue.code,
        message: issue.message,
        path: issue.path.join('.'),
      })),
    })
    return false
  }

  return true
}

type DirectiveStructureValidationResult = {
  message?: string
  valid: boolean
}

const DIRECTIVE_OPEN_REGEX = /^(\s*)(:{2,})([a-z][\w-]*)(?:\[[^\]\n]*\])?(?:\{[^}\n]*\}\s*)*$/i
const DIRECTIVE_CLOSE_REGEX = /^(\s*)(:{3,})\s*$/

export function validateDirectiveStructure(markdown: string): DirectiveStructureValidationResult {
  const lines = markdown.split('\n')
  const stack: Array<{ count: number, directiveName: string, line: number }> = []

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    const openMatch = line.match(DIRECTIVE_OPEN_REGEX)
    if (openMatch) {
      const markerCount = openMatch[2].length
      const directiveName = openMatch[3].toLowerCase()
      const definition = directiveComponentRegistry[directiveName as DirectiveName]

      if (!definition) {
        return {
          valid: false,
          message: `Unknown directive "${openMatch[3]}" on line ${index + 1}.`,
        }
      }

      if (definition.blockKind === 'leaf') {
        if (markerCount !== 2) {
          return {
            valid: false,
            message: `Leaf directive "${definition.directiveName}" must use exactly 2 colons on line ${index + 1}.`,
          }
        }

        continue
      }

      if (markerCount < 3) {
        return {
          valid: false,
          message: `Container directive "${definition.directiveName}" must use at least 3 colons on line ${index + 1}.`,
        }
      }

      const parent = stack[stack.length - 1]
      if (parent && markerCount >= parent.count) {
        return {
          valid: false,
          message: `Nested container "${definition.directiveName}" on line ${index + 1} must use fewer colons than its parent "${parent.directiveName}".`,
        }
      }

      stack.push({
        count: markerCount,
        directiveName: definition.directiveName,
        line: index + 1,
      })
      continue
    }

    const closeMatch = line.match(DIRECTIVE_CLOSE_REGEX)
    if (closeMatch) {
      const markerCount = closeMatch[2].length
      const current = stack[stack.length - 1]

      if (!current) {
        return {
          valid: false,
          message: `Closing fence on line ${index + 1} does not match any open directive.`,
        }
      }

      if (markerCount !== current.count) {
        return {
          valid: false,
          message: `Closing fence on line ${index + 1} must use exactly ${current.count} colons to close "${current.directiveName}".`,
        }
      }

      stack.pop()
    }
  }

  if (stack.length > 0) {
    const current = stack[stack.length - 1]
    return {
      valid: false,
      message: `Directive "${current.directiveName}" opened on line ${current.line} is missing its closing fence.`,
    }
  }

  return { valid: true }
}

export function getDirectiveGenerationGuide() {
  const definitions = Object.values(directiveComponentRegistry)

  const registryGuide = definitions
    .map((definition) => {
      const attributes = definition.allowedAttributes.length > 0
        ? definition.allowedAttributes.join(', ')
        : 'none'
      const notes = definition.generationNotes.map(note => `- ${note}`).join('\n')
      const useCases = definition.useCases.map(useCase => `- ${useCase}`).join('\n')

      return [
        `${definition.directiveName} (${definition.blockKind})`,
        `Description: ${definition.description}`,
        `UI description: ${definition.uiDescription}`,
        `Allowed attributes: ${attributes}`,
        `Best use cases:`,
        useCases,
        `Notes:`,
        notes,
      ].join('\n')
    })
    .join('\n\n')

  const fewShotExamples = definitions
    .flatMap(definition =>
      definition.fewShotExamples.map((example, index) =>
        [
          `Few-shot example (${definition.directiveName} #${index + 1}):`,
          `Intent: ${example.intent}`,
          'Markdown:',
          example.markdown,
        ].join('\n'),
      ),
    )
    .join('\n\n')

  return [
    'Directive syntax rules:',
    '- `::name` is a leaf directive and cannot contain child content.',
    '- `:::name` or more colons is a container directive and can contain child markdown.',
    '- For generated markdown, always close a container with exactly the same number of colons as its opening fence.',
    '- When nesting container directives, the parent must use more colons than the child.',
    '- Never place a `:::` container inside a `::` leaf directive.',
    '- Never let child content appear after the closing fence of its directive.',
    '',
    'Registered directives:',
    registryGuide,
    '',
    'Few-shot examples:',
    fewShotExamples,
  ].join('\n')
}

export type WithIconCardListProps = z.infer<typeof withIconCardListPropsSchema>
export type WithIconCardItemProps = z.infer<typeof withIconCardItemPropsSchema>
