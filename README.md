# 紙本數獨輔助系統

幫助你解紙本數獨的小工具：拍照辨識盤面、計算候選數字、檢查錯誤，並依「簡單→困難」順序給出技巧提示——但不會直接告訴你答案。

## 架構

- `frontend/`：Vite + React + TypeScript 前端 SPA
- `api/`：Express + TypeScript API（`/api/health`、`/api/sudoku/scan`、`/api/sudoku/analyze`）

## 功能

- **拍照辨識**：上傳紙本數獨照片，使用 Claude 視覺辨識自動填入盤面（辨識後可手動修正）
- **候選數字**：依目前盤面計算每格還剩哪些可能的數字
- **錯誤檢查**：標示違反數獨規則（同列/欄/宮重複）的格子
- **提示**：依「唯一候選數 → 隱性唯一數 → 區塊定位」順序，指出可以使用技巧的位置，但不直接給答案
- **進度/難度評估**：顯示完成度百分比與目前盤面所需的技巧難度

## 本機開發

### 步驟一：設定環境變數

```bash
cp .env.example .env
```

編輯 `.env`，填入你的 Anthropic API 金鑰：

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

辨識功能使用的模型可透過 `SUDOKU_OCR_MODEL` 調整（預設 `claude-sonnet-4-6`）。

### 步驟二：啟動後端 API

```bash
cd api
npm install
npm run dev
```

預設在 `http://localhost:5000` 提供 `/api/...` 路由。

### 步驟三：啟動前端

另開一個終端機：

```bash
cd frontend
npm install
npm run dev
```

開啟瀏覽器訪問 `http://localhost:5173`，前端開發伺服器會將 `/api/*` 請求 proxy 到後端的 `http://localhost:5000`。

## 部署到 Vercel

repo 內已包含 `vercel.json`：

- 前端：build `frontend/`（`npm install && npm run build`），輸出 `frontend/dist` 作為靜態網站
- 後端：`api/index.ts` 以 Node.js serverless function 部署，並透過 rewrite 將 `/api/*` 導向該 function

1. 到 [Vercel](https://vercel.com/) 用此 repo 建立新專案（Import Project）
2. 在 Vercel 專案的 **Settings → Environment Variables** 新增：
   - `ANTHROPIC_API_KEY`：你的 Anthropic API 金鑰
   - `SUDOKU_OCR_MODEL`（可選）：辨識模型，預設 `claude-sonnet-4-6`
3. 部署完成後開啟分配到的網址即可使用

### 注意事項

- Vercel serverless function 的請求大小限制約為 4.5MB，本專案已將圖片上傳大小限制設為 4MB，請上傳適度大小的照片
- 拍照辨識需呼叫 Claude API，若執行時間較長，可在 `vercel.json` 加入 `functions` 設定調整 `maxDuration`（依方案而有上限）
