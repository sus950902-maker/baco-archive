import imageCompression from "browser-image-compression"

export const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/afxj9khk/image/upload"
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

export function publicIdFromUrl(url) {
  if (!url || !url.includes("res.cloudinary.com")) return ""
  try {
    const path = new URL(url).pathname
    const marker = "/image/upload/"
    const start = path.indexOf(marker)
    if (start < 0) return ""
    const rest = path.slice(start + marker.length).replace(/^v\d+\//, "")
    return decodeURIComponent(rest.replace(/\.[a-z0-9]+$/i, ""))
  } catch {
    return ""
  }
}

async function compress(file, options) {
  const attempts = [
    { ...options, useWebWorker: true, fileType: "image/webp" },
    { ...options, useWebWorker: false, fileType: "image/webp" },
    { ...options, useWebWorker: false, fileType: "image/jpeg" },
  ]
  let lastError = null
  for (const attempt of attempts) {
    try {
      const blob = await imageCompression(file, attempt)
      const extension = attempt.fileType === "image/webp" ? "webp" : "jpg"
      return new File([blob], `image.${extension}`, { type: attempt.fileType })
    } catch (error) {
      lastError = error
    }
  }
  throw lastError || new Error("影像壓縮失敗")
}

export function compressAvatar(file) {
  return compress(file, { maxSizeMB: 80 / 1024, maxWidthOrHeight: 531, initialQuality: 0.8 })
}

export function compressCard(file) {
  return compress(file, { maxSizeMB: 0.8, maxWidthOrHeight: 1600, initialQuality: 0.82 })
}

export async function uploadImage(file) {
  const body = new FormData()
  body.append("file", file)
  body.append("upload_preset", "DrawingProject")
  const response = await fetch(CLOUDINARY_URL, { method: "POST", body })
  const payload = await response.json()
  if (!response.ok || !payload.secure_url || !payload.public_id) {
    throw new Error(payload?.error?.message || "上傳失敗")
  }
  return payload
}

export function deleteStoredImage(publicId) {
  if (!publicId) return
  fetch("/api/delete-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicId }),
  }).catch(() => {})
}
