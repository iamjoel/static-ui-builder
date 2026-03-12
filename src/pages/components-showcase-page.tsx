import { useNavigate } from '@tanstack/react-router'
import { MarkdownWithDirective } from '../components/markdown-with-directive'
import { directiveComponentRegistry, type DirectiveName } from '../components/markdown-with-directive/components/markdown-with-directive-schema'
import { previewClassName, showcaseDirectiveNameSet, showcaseDirectiveNames } from '../app/constants'
import { cn } from '../lib/utils'

type ComponentShowcaseEntry = {
  description: string
  directiveName: DirectiveName
  label: string
}

const componentShowcaseEntries: ComponentShowcaseEntry[] = showcaseDirectiveNames.map((directiveName) => ({
  directiveName,
  label: directiveComponentRegistry[directiveName].directiveName,
  description: directiveComponentRegistry[directiveName].description,
}))

export function ComponentsShowcasePage({ activeDirectiveName }: { activeDirectiveName?: DirectiveName }) {
  const navigate = useNavigate()
  const fallbackDirectiveName = componentShowcaseEntries[0]?.directiveName
  const selectedDirectiveName = activeDirectiveName && showcaseDirectiveNameSet.has(activeDirectiveName)
    ? activeDirectiveName
    : fallbackDirectiveName

  if (!selectedDirectiveName)
    return null

  const selectedDirective = directiveComponentRegistry[selectedDirectiveName]
  const selectedMarkdown = selectedDirective.fewShotExamples[0]?.markdown ?? ''
  const selectedAllowedAttributes = selectedDirective.allowedAttributes.join(', ') || 'none'
  const selectedExampleTitle = selectedDirective.fewShotExamples[0]?.intent ?? 'Preview example'

  return (
    <section className="space-y-4">
      <div className="border-b pb-4">
        <p className="text-sm font-medium text-muted-foreground">Component Gallery</p>
        <div className="mt-1 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Static Markdown Components</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Display-first directives for product, docs, and content presentation pages.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {componentShowcaseEntries.length}
            {' '}
            directives
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:h-[calc(100dvh-12rem)] xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-card">
          <div className="border-b px-4 py-3">
            <p className="text-sm font-semibold">Components</p>
            <p className="mt-1 text-sm text-muted-foreground">Select a directive to inspect its details and preview.</p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            <div className="space-y-1.5">
              {componentShowcaseEntries.map(entry => (
                <button
                  key={entry.directiveName}
                  type="button"
                  onClick={() => navigate({ to: '/components/$directiveName', params: { directiveName: entry.directiveName } })}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2.5 text-left transition-colors',
                    entry.directiveName === selectedDirectiveName
                      ? 'border-primary/20 bg-primary/6'
                      : 'border-transparent hover:bg-muted/60',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{entry.label}</p>
                    <span className="text-xs text-muted-foreground">
                      {directiveComponentRegistry[entry.directiveName].allowedAttributes.length}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{entry.description}</p>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-card">
          <div className="border-b px-4 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold tracking-tight">{selectedDirective.directiveName}</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{selectedDirective.uiDescription}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Attributes:</span>
                {' '}
                {selectedAllowedAttributes}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-5">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Description</p>
                    <p className="mt-2 text-sm leading-6">{selectedDirective.description}</p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Best use cases</p>
                      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-muted-foreground">
                        {selectedDirective.useCases.map(useCase => (
                          <li key={useCase}>{useCase}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Generation notes</p>
                      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-muted-foreground">
                        {selectedDirective.generationNotes.map(note => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Markdown example</p>
                    <span className="text-xs text-muted-foreground">{selectedExampleTitle}</span>
                  </div>
                  <pre className="overflow-auto rounded-xl border bg-muted p-4 text-sm leading-6 text-foreground">
                    <code>{selectedMarkdown}</code>
                  </pre>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold">Preview</p>
                    <p className="text-sm text-muted-foreground">Rendered from the first showcase example for this directive.</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{selectedExampleTitle}</span>
                </div>

                <div className="mt-3 rounded-xl border bg-muted/20 px-5 py-5">
                  <MarkdownWithDirective markdown={selectedMarkdown} className={previewClassName} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
