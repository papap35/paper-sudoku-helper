import Anthropic from '@anthropic-ai/sdk'

const SUDOKU_OCR_MODEL = process.env.SUDOKU_OCR_MODEL || 'claude-sonnet-4-6'

const OCR_PROMPT = `這張圖片是一張紙本 9x9 數獨棋盤的照片，裡面可能包含印刷的原始數字，也可能有手寫填入的數字。

注意「透頁」問題：紙本書籍背面頁的文字或數字常會透過紙張，以較淡、模糊、灰色的樣子顯示在這一頁上。請只辨識顏色深、清晰、確實印在格線內的數字，忽略任何顏色明顯較淡、模糊不清、像是從背面透過來的數字或圖案。如果同一格內同時看到深色數字與淺色透頁痕跡，只採用深色的那個；如果一格內只有淺色透頁痕跡而沒有深色數字，視為空格（0）。

請仔細逐列、逐欄辨識每一格目前的數字：
- 空白格請用 0 表示
- 有數字的格子請填入 1-9

只回傳一個 JSON 物件，格式如下，不要加任何說明文字或 markdown code block：
{"grid": [[第1列9個數字], [第2列9個數字], ..., [第9列9個數字]]}`

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
const SUPPORTED_MEDIA_TYPES: ImageMediaType[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return client
}

/** 使用 Claude 視覺辨識，將數獨照片轉成 9x9 數字陣列（0 表示空格）。 */
export async function extractGridFromImage(
  imageBytes: Buffer,
  mediaType: string = 'image/jpeg',
): Promise<number[][]> {
  const resolvedMediaType: ImageMediaType = SUPPORTED_MEDIA_TYPES.includes(mediaType as ImageMediaType)
    ? (mediaType as ImageMediaType)
    : 'image/jpeg'

  const response = await getClient().messages.create({
    model: SUDOKU_OCR_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: resolvedMediaType,
              data: imageBytes.toString('base64'),
            },
          },
          { type: 'text', text: OCR_PROMPT },
        ],
      },
    ],
  })

  const block = response.content[0]
  const text = block?.type === 'text' ? block.text.trim() : ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) {
    throw new Error('無法解析辨識結果')
  }

  const data = JSON.parse(match[0])
  const grid = data?.grid

  if (
    !Array.isArray(grid) ||
    grid.length !== 9 ||
    grid.some((row: unknown) => !Array.isArray(row) || row.length !== 9)
  ) {
    throw new Error('辨識結果不是有效的 9x9 盤面')
  }

  return grid.map((row: unknown[]) =>
    row.map((v) => (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 9 ? v : 0)),
  )
}
