import { MarkdownWithDirective } from '../components/markdown-with-directive'
import { conversionTestScenes, previewClassName } from '../app/constants'

export function ConversionTestScenePage({ sceneId }: { sceneId: string }) {
  const scene = conversionTestScenes.find(item => item.id === sceneId)

  if (!scene)
    return null

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(40,86,163,0.12),_transparent_40%),linear-gradient(180deg,_#f8fafc_0%,_#eef3f9_100%)] px-8 py-8 text-foreground lg:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[28px] border bg-background/96 p-8 shadow-[0_32px_80px_rgba(15,23,42,0.08)] lg:p-10">
          <div className="mb-8 flex items-start justify-between gap-6 border-b pb-6">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-muted-foreground">Conversion Test Scene</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">{scene.title}</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{scene.description}</p>
            </div>
            <div className="rounded-full border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground">
              {scene.id}
            </div>
          </div>

          <div className="rounded-[24px] border bg-muted/20 px-8 py-8">
            <MarkdownWithDirective markdown={scene.markdown} className={previewClassName} />
          </div>
        </div>
      </div>
    </main>
  )
}
