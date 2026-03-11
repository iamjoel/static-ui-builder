import { useState } from 'react'
import { MarkdownWithDirective } from './components/markdown-with-directive'

const initialMarkdown = `# Markdown Editor

左侧输入 Markdown，右侧实时预览。

## 普通内容

- 支持标题、列表、引用、代码块
- 支持自定义 directive

::::withIconCardList
:::withIconCardItem{icon="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/2705.svg"}
渲染自定义卡片项
:::
:::withIconCardItem{icon="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4a1.svg"}
属性会先经过校验，再渲染
:::
::::
`

function App() {
  const [markdown, setMarkdown] = useState(initialMarkdown)

  return (
    <main
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,210,154,0.55),transparent_28%),radial-gradient(circle_at_right_20%,rgba(145,194,255,0.4),transparent_24%),linear-gradient(180deg,#fffaf2_0%,#f5f8ff_100%)] px-[18px] py-[18px] text-[#172033] md:px-8 md:py-8"
    >
      <header className="mx-auto mb-6 flex max-w-[1440px] flex-col gap-6 md:items-end md:justify-between lg:flex-row">
        <div>
          <p className="mb-2 text-[0.8rem] font-bold uppercase tracking-[0.18em] text-[#9f5c00]">
            Static UI Builder
          </p>
          <h1 className="m-0 text-[clamp(2rem,4vw,3.75rem)] leading-[0.95] tracking-[-0.04em]">
            Markdown Directive Editor
          </h1>
        </div>
        <p className="m-0 max-w-[420px] text-base leading-7 text-[#526079]">
          左侧粘贴字符串，右侧实时渲染组件化内容。
        </p>
      </header>

      <section className="mx-auto grid max-w-[1440px] grid-cols-1 gap-5 lg:grid-cols-[minmax(320px,1fr)_minmax(320px,1fr)]">
        <div className="flex min-h-[420px] flex-col overflow-hidden rounded-3xl border border-[rgba(23,32,51,0.08)] bg-[rgba(255,255,255,0.78)] shadow-[0_20px_60px_rgba(28,39,63,0.12)] backdrop-blur-[18px] lg:min-h-[70vh]">
          <div className="flex items-baseline justify-between gap-3 border-b border-[rgba(23,32,51,0.08)] px-[22px] py-5">
            <h2 className="m-0 text-[1.05rem]">Input</h2>
            <span className="text-[0.9rem] text-[#66738b]">Markdown / directive</span>
          </div>
          <textarea
            className="min-h-0 flex-1 resize-none border-0 bg-transparent px-[22px] py-[22px] font-['IBM_Plex_Mono','SFMono-Regular',Consolas,monospace] text-[0.96rem] leading-[1.7] text-[#172033] outline-none"
            value={markdown}
            onChange={event => setMarkdown(event.target.value)}
            spellCheck={false}
            aria-label="Markdown input"
          />
        </div>

        <div className="relative flex min-h-[420px] flex-col overflow-hidden rounded-3xl border border-[rgba(23,32,51,0.08)] bg-[rgba(255,255,255,0.78)] shadow-[0_20px_60px_rgba(28,39,63,0.12)] backdrop-blur-[18px] lg:min-h-[70vh]">
          <div className="flex items-baseline justify-between gap-3 border-b border-[rgba(23,32,51,0.08)] px-[22px] py-5">
            <h2 className="m-0 text-[1.05rem]">Preview</h2>
            <span className="text-[0.9rem] text-[#66738b]">Rendered output</span>
          </div>
          <div className="flex-1 overflow-auto px-[22px] py-[22px]">
            <MarkdownWithDirective
              markdown={markdown}
              className="text-[#1f2940] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_a]:text-[#0c63e7] [&_blockquote]:mb-4 [&_blockquote]:border-l-4 [&_blockquote]:border-[#ffd37f] [&_blockquote]:pl-4 [&_blockquote]:text-[#6f5a2a] [&_code]:rounded-md [&_code]:bg-[#eef3ff] [&_code]:px-[0.35rem] [&_code]:py-[0.1rem] [&_code]:font-['IBM_Plex_Mono','SFMono-Regular',Consolas,monospace] [&_code]:text-[0.92em] [&_h1]:my-[1.4em] [&_h1]:mb-[0.6em] [&_h1]:leading-[1.15] [&_h1]:tracking-[-0.03em] [&_h2]:my-[1.4em] [&_h2]:mb-[0.6em] [&_h2]:leading-[1.15] [&_h2]:tracking-[-0.03em] [&_h3]:my-[1.4em] [&_h3]:mb-[0.6em] [&_h3]:leading-[1.15] [&_h3]:tracking-[-0.03em] [&_h4]:my-[1.4em] [&_h4]:mb-[0.6em] [&_h4]:leading-[1.15] [&_h4]:tracking-[-0.03em] [&_li+li]:mt-[0.35rem] [&_ol]:mb-4 [&_ol]:pl-[1.3rem] [&_p]:mb-4 [&_pre]:mb-4 [&_pre]:overflow-auto [&_pre]:rounded-[14px] [&_pre]:bg-[#101827] [&_pre]:p-4 [&_pre]:text-[#f5f7fb] [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit [&_ul]:mb-4 [&_ul]:pl-[1.3rem]"
            />
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
