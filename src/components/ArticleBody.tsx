import type { ReactNode } from 'react'

/**
 * Renders long-form localized body text: "## " lines become headings, runs of
 * "- " lines become bullet lists, and blank-line-separated runs become paragraphs.
 * Shared by the policy / advertisement / link / news detail layouts.
 */
export default function ArticleBody({ text }: { text: string }) {
  const blocks: ReactNode[] = []
  let bullets: string[] = []
  let para: string[] = []

  const flushBullets = () => {
    if (!bullets.length) return
    blocks.push(
      <ul key={blocks.length} className="list-disc pl-5 space-y-1.5">
        {bullets.map((b, i) => (
          <li key={i} className="text-sm leading-6 text-text-normal">{b}</li>
        ))}
      </ul>,
    )
    bullets = []
  }
  const flushPara = () => {
    if (!para.length) return
    blocks.push(<p key={blocks.length} className="text-sm leading-6 text-text-normal">{para.join(' ')}</p>)
    para = []
  }

  for (const line of text.split('\n')) {
    const s = line.trim()
    if (s.startsWith('## ')) {
      flushBullets(); flushPara()
      blocks.push(
        <h2 key={blocks.length} className="text-[15px] font-bold text-text-normal pt-2 border-t border-neutral-95 first:border-t-0 first:pt-0">
          {s.slice(3)}
        </h2>,
      )
    } else if (s.startsWith('- ')) {
      flushPara()
      bullets.push(s.slice(2))
    } else if (s === '') {
      flushBullets(); flushPara()
    } else {
      flushBullets()
      para.push(s)
    }
  }
  flushBullets(); flushPara()
  return <div className="flex flex-col gap-3">{blocks}</div>
}
