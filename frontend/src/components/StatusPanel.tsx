import type { AnalyzeResult } from '../types'

interface StatusPanelProps {
  analysis: AnalyzeResult | null
  hintText: string
  message: { text: string; isError: boolean } | null
}

export default function StatusPanel({ analysis, hintText, message }: StatusPanelProps) {
  const progress = analysis?.progress
  const percent = progress?.percent ?? 0
  const progressText = progress
    ? `已填入 ${progress.filled} / ${progress.total} 格 (${progress.percent}%)　目前難度：${progress.difficulty}`
    : ''

  return (
    <section className="status">
      <div className="progress-text">{progressText}</div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="hint-text">{hintText}</div>
      <div className="message" style={{ color: message?.isError ? '#c0392b' : '#3a8a3a' }}>
        {message?.text ?? ''}
      </div>
    </section>
  )
}
