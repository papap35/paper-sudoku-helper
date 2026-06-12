import 'dotenv/config'
import express from 'express'
import multer from 'multer'
import { analyze, isValidGrid } from './sudokuSolver'
import { extractGridFromImage } from './sudokuOcr'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB，配合 Vercel 等平台的請求大小限制
})

const app = express()
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/sudoku/scan', upload.single('image'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: '請上傳一張數獨盤面照片' })
    return
  }

  try {
    const grid = await extractGridFromImage(req.file.buffer, req.file.mimetype)
    res.json({ grid })
  } catch (err) {
    console.error('Sudoku OCR failed', err)
    res.status(400).json({ error: '辨識失敗，請換一張較清晰的照片，或直接手動輸入' })
  }
})

app.post('/api/sudoku/analyze', (req, res) => {
  const grid = req.body?.grid

  if (!isValidGrid(grid)) {
    res.status(400).json({ error: '盤面格式錯誤，請確認是 9x9、內容為 0-9 的數字' })
    return
  }

  res.json(analyze(grid))
})

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: '圖片檔案過大，請換一張較小的照片' })
    return
  }
  console.error(err)
  res.status(500).json({ error: '伺服器發生錯誤' })
})

export default app
