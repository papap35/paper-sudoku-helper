import os
import json
import re
import base64
import anthropic


SUDOKU_OCR_MODEL = os.environ.get('SUDOKU_OCR_MODEL', 'claude-sonnet-4-6')

OCR_PROMPT = """這張圖片是一張紙本 9x9 數獨棋盤的照片，裡面可能包含印刷的原始數字，也可能有手寫填入的數字。

請仔細逐列、逐欄辨識每一格目前的數字：
- 空白格請用 0 表示
- 有數字的格子請填入 1-9

只回傳一個 JSON 物件，格式如下，不要加任何說明文字或 markdown code block：
{"grid": [[第1列9個數字], [第2列9個數字], ..., [第9列9個數字]]}"""

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))
    return _client


def extract_grid_from_image(image_bytes: bytes, media_type: str = 'image/jpeg') -> list[list[int]]:
    """使用 Claude 視覺辨識，將數獨照片轉成 9x9 數字陣列（0 表示空格）。"""
    client = _get_client()
    image_b64 = base64.b64encode(image_bytes).decode('utf-8')

    response = client.messages.create(
        model=SUDOKU_OCR_MODEL,
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": image_b64,
                    },
                },
                {"type": "text", "text": OCR_PROMPT},
            ],
        }],
    )

    text = response.content[0].text.strip()
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if not match:
        raise ValueError("無法解析辨識結果")

    data = json.loads(match.group(0))
    grid = data.get('grid')

    if not isinstance(grid, list) or len(grid) != 9 or any(
        not isinstance(row, list) or len(row) != 9 for row in grid
    ):
        raise ValueError("辨識結果不是有效的 9x9 盤面")

    return [[v if isinstance(v, int) and 0 <= v <= 9 else 0 for v in row] for row in grid]
