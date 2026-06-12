import Anthropic from '@anthropic-ai/sdk'

const SUDOKU_OCR_MODEL = process.env.SUDOKU_OCR_MODEL || 'claude-sonnet-4-6'

const OCR_PROMPT = `這張圖片是一張紙本 9x9 數獨棋盤的照片，裡面可能包含印刷的原始數字，也可能有手寫填入的數字。

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
