import os
import logging

from dotenv import load_dotenv

load_dotenv()

from flask import Flask, request, jsonify

import sudoku_ocr
import sudoku_solver

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 4 * 1024 * 1024  # 4MB，配合 Vercel 等平台的請求大小限制


@app.route('/api/health')
def health():
    return {'status': 'ok'}


@app.route('/api/sudoku/scan', methods=['POST'])
def sudoku_scan():
    image = request.files.get('image')
    if not image or not image.filename:
        return jsonify({'error': '請上傳一張數獨盤面照片'}), 400

    try:
        grid = sudoku_ocr.extract_grid_from_image(
            image.read(), media_type=image.mimetype or 'image/jpeg'
        )
    except Exception:
        logger.exception("Sudoku OCR failed")
        return jsonify({'error': '辨識失敗，請換一張較清晰的照片，或直接手動輸入'}), 400

    return jsonify({'grid': grid})


@app.route('/api/sudoku/analyze', methods=['POST'])
def sudoku_analyze():
    data = request.get_json(silent=True) or {}
    grid = data.get('grid')

    if not sudoku_solver.is_valid_grid(grid):
        return jsonify({'error': '盤面格式錯誤，請確認是 9x9、內容為 0-9 的數字'}), 400

    return jsonify(sudoku_solver.analyze(grid))


if __name__ == '__main__':
    port = int(os.environ.get('PORT', '5000'))
    app.run(host='0.0.0.0', port=port)
