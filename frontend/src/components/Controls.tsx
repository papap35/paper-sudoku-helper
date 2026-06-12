interface ControlsProps {
  showCandidates: boolean
  onAnalyze: () => void
  onHint: () => void
  onClear: () => void
  onToggleCandidates: (checked: boolean) => void
}

export default function Controls({
  showCandidates,
  onAnalyze,
  onHint,
  onClear,
  onToggleCandidates,
}: ControlsProps) {
  return (
    <section className="controls">
      <button type="button" onClick={onAnalyze}>
        分析盤面（候選數字 / 錯誤檢查）
      </button>
      <label className="toggle">
        <input
          type="checkbox"
          checked={showCandidates}
          onChange={(e) => onToggleCandidates(e.target.checked)}
        />
        顯示候選數字
      </label>
      <button type="button" onClick={onHint}>
        給我一個提示
      </button>
      <button type="button" className="secondary" onClick={onClear}>
        清空盤面
      </button>
    </section>
  )
}
