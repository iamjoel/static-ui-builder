import type { DirectiveName } from '../components/markdown-with-directive/components/markdown-with-directive-schema'
import type { CreatePageDraft, EditorState } from './types'

export const blankCreateDraft: CreatePageDraft = {
  title: '',
  summary: '',
}

export const blankEditorState: EditorState = {
  title: '',
  markdown: '',
}

export const previewClassName = 'text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_blockquote]:mb-4 [&_blockquote]:border-l [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-[\'IBM_Plex_Mono\',\'SFMono-Regular\',Consolas,monospace] [&_code]:text-[0.92em] [&_h1]:mb-5 [&_h1]:text-[2rem] [&_h1]:font-semibold [&_h1]:tracking-[-0.04em] [&_h2]:mb-4 [&_h2]:mt-8 [&_h2]:text-[1.35rem] [&_h2]:font-semibold [&_h2]:tracking-[-0.03em] [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-[1.05rem] [&_h3]:font-semibold [&_h4]:mb-3 [&_h4]:mt-5 [&_h4]:text-sm [&_h4]:font-semibold [&_li+li]:mt-1.5 [&_ol]:mb-4 [&_ol]:pl-5 [&_p]:mb-4 [&_pre]:mb-4 [&_pre]:overflow-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:text-foreground [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit [&_ul]:mb-4 [&_ul]:pl-5'

export const showcaseDirectiveNames = [
  'callout',
  'featuregrid',
  'featureitem',
  'statscards',
  'statcard',
  'comparecards',
  'comparecard',
] as const satisfies DirectiveName[]

export const showcaseDirectiveNameSet = new Set<DirectiveName>(showcaseDirectiveNames)

export const conversionTestScenes = [
  {
    id: 'launch-overview',
    title: 'Launch Overview',
    description: 'A balanced mix of callout and feature grid blocks for a marketing-style conversion test.',
    markdown: `# Launch your content hub faster

:::callout{tone="info" title="New release" icon="🚀"}
The visual workspace is now available for every team and can be adopted without a migration project.
:::

## Why teams switch

::::featureGrid{columns="3"}
:::featureItem{title="Fast setup" icon="⚡"}
Create a workspace, invite teammates, and publish a first draft in minutes.
:::
:::featureItem{title="Shared rules" icon="🧭"}
Keep layout and content structure aligned across product, ops, and support pages.
:::
:::featureItem{title="Safer reuse" icon="🧩"}
Turn repeated sections into reliable blocks that stay easy to scan and maintain.
:::
::::`,
  },
  {
    id: 'weekly-metrics',
    title: 'Weekly Metrics',
    description: 'A metrics-heavy scene for testing static KPI card recognition and supporting context.',
    markdown: `# Weekly activation snapshot

## This week at a glance

::::statsCards{columns="3"}
:::statCard{label="Activation rate" value="68%" hint="First-week completion" trend="up"}
:::
:::statCard{label="Avg. setup time" value="12 min" hint="From signup to first publish" trend="down"}
:::
:::statCard{label="Teams onboarded" value="1,240" hint="Last 30 days" trend="up"}
:::
::::

:::callout{tone="success" title="Momentum is building" icon="✅"}
Faster onboarding and clearer templates are contributing to better first-week activation.
:::`,
  },
  {
    id: 'plan-comparison',
    title: 'Plan Comparison',
    description: 'A plan selection scene centered around comparison cards and one summary callout.',
    markdown: `# Choose the right workspace plan

:::callout{tone="warning" title="Best fit guidance" icon="💡"}
Choose Starter for solo work. Choose Team if you need role-based access and shared governance.
:::

::::compareCards{columns="2"}
:::compareCard{title="Starter" badge="For individuals" highlight="false"}
- 3 active projects
- Shared templates
- Email support
:::
:::compareCard{title="Team" badge="Most popular" highlight="true"}
- Unlimited projects
- Role-based access
- Priority support
:::
::::`,
  },
  {
    id: 'editor-rollout',
    title: 'Editor Rollout',
    description: 'A mixed layout scene with benefits, stats, and a rollout note for conversion testing.',
    markdown: `# Editor rollout for distributed teams

:::callout{tone="info" title="Rollout note" icon="🛠️"}
Start with one shared template set, then expand to regional teams after the first review cycle.
:::

## Core improvements

::::featureGrid{columns="2"}
:::featureItem{title="Review-ready drafts" icon="📝"}
Writers can turn screenshots into structured Markdown before handoff.
:::
:::featureItem{title="Consistent delivery" icon="📦"}
Teams publish updates with the same visual language across launches and changelogs.
:::
::::

## Early results

::::statsCards{columns="2"}
:::statCard{label="Review cycles" value="-32%" hint="Compared with the previous process" trend="down"}
:::
:::statCard{label="Template reuse" value="74%" hint="Across newly created pages" trend="up"}
:::
::::`,
  },
] as const

export type ConversionTestScene = (typeof conversionTestScenes)[number]
