import * as z from 'zod'

const commonSchema = {
  className: z.string().min(1).optional(),
}
export const withIconCardListPropsSchema = z.object(commonSchema).strict()

const HTTP_URL_REGEX = /^https?:\/\//i

export const withIconCardItemPropsSchema = z.object({
  ...commonSchema,
  icon: z.string().trim().url().refine(
    value => HTTP_URL_REGEX.test(value),
    'icon must be a http/https URL',
  ),
}).strict()

export const directivePropsSchemas = {
  withiconcardlist: withIconCardListPropsSchema,
  withiconcarditem: withIconCardItemPropsSchema,
} as const

type DirectiveRegistryEntry = {
  allowedAttributes: string[]
  blockKind: 'container' | 'leaf'
  description: string
  directiveName: string
  generationNotes: string[]
  uiDescription: string
  useCases: string[]
}

export const directiveComponentRegistry: Record<keyof typeof directivePropsSchemas, DirectiveRegistryEntry> = {
  withiconcardlist: {
    directiveName: 'withIconCardList',
    blockKind: 'container',
    description: 'Wraps a vertical list of custom card items.',
    uiDescription: 'Renders a vertical stack of clean white cards with subtle borders and spacing between items.',
    allowedAttributes: ['className'],
    generationNotes: [
      'Use this as a parent wrapper around one or more withIconCardItem blocks.',
      'Keep children as directive blocks instead of mixing loose paragraphs between item blocks.',
    ],
    useCases: [
      'Short highlight lists, product features, benefits, checklist-style summaries, or compact step overviews.',
      'Works best when each child item is a short phrase, one sentence, or a very small markdown block.',
    ],
  },
  withiconcarditem: {
    directiveName: 'withIconCardItem',
    blockKind: 'container',
    description: 'Renders one icon card item with child markdown content.',
    uiDescription: 'Shows a rounded horizontal card with a 40px icon on the left and concise text content on the right.',
    allowedAttributes: ['icon', 'className'],
    generationNotes: [
      'Usually place this inside withIconCardList.',
      'The icon attribute must be a public http/https URL.',
      'Put the visible text inside the directive body, not after the closing fence.',
      'Keep content concise so it visually fits as a compact card item.',
    ],
    useCases: [
      'Best for single benefits, facts, action points, feature bullets, and short status notes.',
      'Avoid using it for long paragraphs, tables, or large multi-section content.',
    ],
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
  const registryGuide = Object.values(directiveComponentRegistry)
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

  const fewShotExamples = [
    [
      'Few-shot example 1:',
      'Intent: Convert three short product advantages into icon cards.',
      'Markdown:',
      '## 核心优势',
      '',
      '::::withIconCardList',
      ':::withIconCardItem{icon="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/26a1.svg"}',
      '响应速度快，适合实时协作。',
      ':::',
      ':::withIconCardItem{icon="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f512.svg"}',
      '权限边界清晰，适合团队使用。',
      ':::',
      ':::withIconCardItem{icon="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4ca.svg"}',
      '数据看板直观，便于快速决策。',
      ':::',
      '::::',
    ].join('\n'),
    [
      'Few-shot example 2:',
      'Intent: Summarize a three-step workflow with compact card items.',
      'Markdown:',
      '## 使用流程',
      '',
      '::::withIconCardList',
      ':::withIconCardItem{icon="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4e5.svg"}',
      '**上传素材**',
      '',
      '拖入截图或设计稿作为输入。',
      ':::',
      ':::withIconCardItem{icon="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/2699.svg"}',
      '**调整参数**',
      '',
      '根据需求修改提示词和结构。',
      ':::',
      ':::withIconCardItem{icon="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f680.svg"}',
      '**生成结果**',
      '',
      '得到可继续编辑的 Markdown 初稿。',
      ':::',
      '::::',
    ].join('\n'),
    [
      'Few-shot example 3:',
      'Intent: Use normal markdown for long explanations, and directives only for short highlights.',
      'Markdown:',
      '## 方案说明',
      '',
      '这里先用普通段落解释背景和目标，不要把整段说明都塞进指令卡片。',
      '',
      '::::withIconCardList',
      ':::withIconCardItem{icon="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/2705.svg"}',
      '重点一：输出结构固定，便于复用。',
      ':::',
      ':::withIconCardItem{icon="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4a1.svg"}',
      '重点二：关键提示单独强调，方便扫读。',
      ':::',
      '::::',
    ].join('\n'),
  ].join('\n\n')

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
