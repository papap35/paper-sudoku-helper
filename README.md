# 紙本數獨輔助系統

幫助你解紙本數獨的小工具：拍照辨識盤面、計算候選數字、檢查錯誤，並依「簡單→困難」順序給出技巧提示——但不會直接告訴你答案。

## 功能

- **拍照辨識**：上傳紙本數獨照片，使用 Claude 視覺辨識自動填入盤面（辨識後可手動修正）
- **候選數字**：依目前盤面計算每格還剩哪些可能的數字
- **錯誤檢查**：標示違反數獨規則（同列/欄/宮重複）的格子
- **提示**：依「唯一候選數 → 隱性唯一數 → 區塊定位」順序，指出可以使用技巧的位置，但不直接給答案
- **進度/難度評估**：顯示完成度百分比與目前盤面所需的技巧難度

## 安裝設定

### 步驟一：設定環境變數

```bash
cp .env.example .env
```

編輯 `.env`，填入你的 Anthropic API 金鑰：

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

辨識功能使用的模型可透過 `SUDOKU_OCR_MODEL` 調整（預設 `claude-sonnet-4-6`）。

### 步驟二：啟動服務

#### 方法 A：Docker（推薦）

```bash
docker compose up -d
```

#### 方法 B：直接用 Python

```bash
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

啟動後開啟瀏覽器訪問 `http://localhost:5000` 即可使用。
