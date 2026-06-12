import type { ChangeEvent } from 'react'

interface UploadBoxProps {
  previewUrl: string | null
  scanning: boolean
  canScan: boolean
  onFileChange: (file: File | null) => void
  onScan: () => void
}

export default function UploadBox({ previewUrl, scanning, canScan, onFileChange, onScan }: UploadBoxProps) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onFileChange(e.target.files?.[0] ?? null)
  }

  return (
    <section className="upload-box">
      <label className="file-label">
        📷 拍照 / 上傳數獨照片
        <input type="file" accept="image/*" capture="environment" onChange={handleChange} />
      </label>
      <button type="button" disabled={!canScan || scanning} onClick={onScan}>
        {scanning ? '辨識中...' : '辨識盤面'}
      </button>
      {previewUrl && <img src={previewUrl} alt="" />}
    </section>
  )
}
