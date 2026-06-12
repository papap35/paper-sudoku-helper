import type { AnalyzeResult } from '../types'

interface StatusPanelProps {
  analysis: AnalyzeResult | null
  hintText: string
  hintExplanation: string[]
  message: { text: string; isError: boolean } | null
}

export default function StatusPanel({ analysis, hintText, hintExplanation, message }: StatusPanelProps) {
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
      {hintExplanation.length > 0 && (
        <details className="hint-explanation">
          <summary>為什麼？（想學技巧的話可以打開看看）</summary>
          <ol>
            {hintExplanation.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        </details>
      )}
      <div className="message" style={{ color: message?.isError ? '#c0392b' : '#3a8a3a' }}>
        {message?.text ?? ''}
      </div>
    </section>
  )
}
