import { useEffect, useMemo, useRef, useState } from 'react'
import SudokuBoard from './components/SudokuBoard'
import UploadBox from './components/UploadBox'
import Controls from './components/Controls'
import StatusPanel from './components/StatusPanel'
import { ApiError, analyzeGrid, scanImage } from './api'
import { emptyGrid, type AnalyzeResult, type Grid } from './types'

type Message = { text: string; isError: boolean } | null

export default function App() {
  const [grid, setGrid] = useState<Grid>(emptyGrid)
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null)
  const [showCandidates, setShowCandidates] = useState(false)
  const [hintCells, setHintCells] = useState<Set<string>>(new Set())
  const [hintText, setHintText] = useState('')
  const [hintExplanation, setHintExplanation] = useState<string[]>([])
  const [message, setMessage] = useState<Message>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[][]>(
    Array.from({ length: 9 }, () => Array(9).fill(null)),
  )

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const conflictSet = useMemo(() => {
    const set = new Set<string>()
    analysis?.conflicts.forEach(([r, c]) => set.add(`${r},${c}`))
    return set
  }, [analysis])

  function clearAnalysis() {
    setAnalysis(null)
    setHintCells(new Set())
    setHintText('')
    setHintExplanation([])
    setMessage(null)
  }

  function handleCellChange(r: number, c: number, value: number) {
    setGrid((prev) => {
      const next = prev.map((row) => [...row])
      next[r][c] = value
      return next
    })
    clearAnalysis()
  }

  async function handleAnalyze() {
    setMessage(null)
    try {
      const result = await analyzeGrid(grid)
      setAnalysis(result)
      setHintCells(new Set())
      setHintExplanation([])

      if (result.conflicts.length > 0) {
        setHintText('⚠️ 標記為紅色的格子互相衝突，請先修正。')
      } else if (result.hint) {
        setHintText(`💡 ${result.hint.technique_name}：${result.hint.message}`)
      } else if (result.progress.filled === result.progress.total) {
        setHintText('🎉 恭喜完成！')
      } else {
        setHintText('目前盤面看起來沒有衝突，但找不到更簡單的提示了，可能需要更進階的技巧。')
      }
    } catch (err) {
      setMessage({ text: err instanceof ApiError ? err.message : '連線失敗，請稍後再試。', isError: true })
    }
  }

  function handleHint() {
    if (!analysis) {
      setMessage({ text: '請先按「分析盤面」', isError: true })
      return
    }

    const hint = analysis.hint
    if (!hint) {
      setHintCells(new Set())
      setHintExplanation([])
      setMessage({ text: '目前沒有可提供的提示。', isError: false })
      return
    }

    setHintCells(new Set(hint.cells.map(([r, c]) => `${r},${c}`)))
    setHintText(`💡 ${hint.technique_name}：${hint.message}`)
    setHintExplanation(hint.explanation)
    setMessage(null)
  }

  function handleClear() {
    setGrid(emptyGrid())
    clearAnalysis()
  }

  function handleFileChange(file: File | null) {
    setImageFile(file)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(file ? URL.createObjectURL(file) : null)
  }

  async function handleScan() {
    if (!imageFile) return

    setScanning(true)
    try {
      const { grid: newGrid } = await scanImage(imageFile)
      setGrid(newGrid)
      clearAnalysis()
      setMessage({ text: '辨識完成，請確認盤面是否正確（可手動修正），再按「分析盤面」。', isError: false })
    } catch (err) {
      setMessage({ text: err instanceof ApiError ? err.message : '連線失敗，請稍後再試。', isError: true })
    } finally {
      setScanning(false)
    }
  }

  return (
    <main className="page">
      <h1>紙本數獨輔助系統</h1>
      <p className="subtitle">
        拍照辨識盤面，或手動輸入，再用候選數字、錯誤檢查與提示來幫助思考——但不會直接告訴你答案。
      </p>

      <UploadBox
        previewUrl={previewUrl}
        scanning={scanning}
        canScan={imageFile !== null}
        onFileChange={handleFileChange}
        onScan={handleScan}
      />

      <div className="board-wrap">
        <SudokuBoard
          grid={grid}
          candidates={analysis?.candidates ?? {}}
          conflicts={conflictSet}
          hintCells={hintCells}
          showCandidates={showCandidates}
          inputRefs={inputRefs}
          onCellChange={handleCellChange}
        />
      </div>

      <Controls
        showCandidates={showCandidates}
        onAnalyze={handleAnalyze}
        onHint={handleHint}
        onClear={handleClear}
        onToggleCandidates={setShowCandidates}
      />

      <StatusPanel analysis={analysis} hintText={hintText} hintExplanation={hintExplanation} message={message} />
    </main>
  )
}
