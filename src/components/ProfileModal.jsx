import { useEffect, useRef, useState } from "react"
import imageCompression from "browser-image-compression"
import { updateProfile } from "firebase/auth"
import { serverTimestamp } from "firebase/firestore"
import { writeOwnUser } from "../accountWrite"
import { issuePublicUid } from "../publicUid"
import IdentityCard from "./IdentityCard"

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/afxj9khk/image/upload"
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const FRAME = 240
const OUTPUT = 512

function place(natural, zoom, offsetX, offsetY) {
  if (!natural.width || !natural.height) return { width: 0, height: 0, x: 0, y: 0 }
  const cover = Math.max(FRAME / natural.width, FRAME / natural.height)
  const width = natural.width * cover * zoom
  const height = natural.height * cover * zoom
  const maxX = Math.max(0, (width - FRAME) / 2)
  const maxY = Math.max(0, (height - FRAME) / 2)
  return {
    width,
    height,
    x: Math.min(maxX, Math.max(-maxX, offsetX)),
    y: Math.min(maxY, Math.max(-maxY, offsetY)),
  }
}

function publicIdFromUrl(url) {
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

async function compressAvatar(file) {
  const base = { maxSizeMB: 80 / 1024, maxWidthOrHeight: 400, initialQuality: 0.8 }
  const attempts = [
    { ...base, useWebWorker: true, fileType: "image/webp" },
    { ...base, useWebWorker: false, fileType: "image/webp" },
    { ...base, useWebWorker: false, fileType: "image/jpeg" },
  ]
  let lastError = null
  for (const options of attempts) {
    try {
      const blob = await imageCompression(file, options)
      const extension = options.fileType === "image/webp" ? "webp" : "jpg"
      return new File([blob], `avatar.${extension}`, { type: options.fileType })
    } catch (error) {
      lastError = error
    }
  }
  throw lastError || new Error("影像壓縮失敗")
}

async function uploadImage(file) {
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

function deleteOldAvatar(publicId) {
  fetch("/api/delete-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicId }),
  }).catch(() => {})
}

export default function ProfileModal({ user, profile, onClose, onSaved, onOpenCharacter }) {
  const savedAvatar = profile?.avatarUrl || user.photoURL || ""
  const [displayName, setDisplayName] = useState(profile?.displayName || user.displayName || "")
  const [preview, setPreview] = useState(savedAvatar)
  const [editable, setEditable] = useState(false)
  const [natural, setNatural] = useState({ width: 0, height: 0 })
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [cardOpen, setCardOpen] = useState(false)
  const drag = useRef(null)
  const imageRef = useRef(null)
  const blobRef = useRef("")
  const generation = useRef(0)
  const [adjusted, setAdjusted] = useState(false)

  const framed = place(natural, zoom, offset.x, offset.y)

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== "Escape" || busy) return
      if (cardOpen) {
        setCardOpen(false)
        return
      }
      onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [busy, cardOpen, onClose])

  useEffect(() => {
    if (!savedAvatar) return undefined
    const token = generation.current
    let cancelled = false
    fetch(savedAvatar)
      .then((response) => {
        if (!response.ok) throw new Error("fetch failed")
        return response.blob()
      })
      .then((blob) => {
        if (cancelled || token !== generation.current) return
        if (blobRef.current) URL.revokeObjectURL(blobRef.current)
        blobRef.current = URL.createObjectURL(blob)
        setPreview(blobRef.current)
        setEditable(true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [savedAvatar])

  function onFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("僅接受 JPG、PNG、WEBP")
      return
    }
    if (file.size > MAX_BYTES) {
      setError("圖片需小於 5MB")
      return
    }

    setError("")
    setStatus("")
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    setNatural({ width: 0, height: 0 })
    setEditable(true)
    setAdjusted(true)
    generation.current += 1
    if (blobRef.current) URL.revokeObjectURL(blobRef.current)
    blobRef.current = URL.createObjectURL(file)
    setPreview(blobRef.current)
  }

  function onPointerDown(event) {
    if (!editable || busy) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { x: event.clientX, y: event.clientY, originX: offset.x, originY: offset.y }
  }

  function onPointerMove(event) {
    if (!drag.current) return
    const next = place(
      natural,
      zoom,
      drag.current.originX + event.clientX - drag.current.x,
      drag.current.originY + event.clientY - drag.current.y,
    )
    setOffset({ x: next.x, y: next.y })
    setAdjusted(true)
  }

  function onPointerUp() {
    drag.current = null
  }

  function onZoom(event) {
    const nextZoom = Number(event.target.value)
    const next = place(natural, nextZoom, offset.x, offset.y)
    setZoom(nextZoom)
    setOffset({ x: next.x, y: next.y })
    setAdjusted(true)
  }

  function cropFile() {
    const image = imageRef.current
    const canvas = document.createElement("canvas")
    canvas.width = OUTPUT
    canvas.height = OUTPUT
    const context = canvas.getContext("2d")
    const scale = OUTPUT / FRAME
    context.drawImage(
      image,
      framed.x * scale + (OUTPUT - framed.width * scale) / 2,
      framed.y * scale + (OUTPUT - framed.height * scale) / 2,
      framed.width * scale,
      framed.height * scale,
    )
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("影像裁切失敗"))
          return
        }
        resolve(new File([blob], "avatar.png", { type: "image/png" }))
      }, "image/png")
    })
  }

  async function save(event) {
    event.preventDefault()
    const name = displayName.trim()
    if (!name) {
      setError("請填寫帳號名稱")
      return
    }

    setError("")
    setStatus("檔案同步中")
    setBusy(true)

    try {
      let avatarUrl = savedAvatar
      let avatarPublicId = profile?.avatarPublicId || publicIdFromUrl(savedAvatar)
      if (adjusted) {
        if (!natural.width) throw new Error("影像尚未載入")
        setStatus("影像壓縮中")
        const compressed = await compressAvatar(await cropFile())
        setStatus("影像上傳中")
        const uploaded = await uploadImage(compressed)
        avatarUrl = uploaded.secure_url
        avatarPublicId = uploaded.public_id
      }

      const publicUid = profile?.publicUid || (await issuePublicUid())
      const record = {
        uid: user.uid,
        publicUid,
        email: user.email || "",
        displayName: name,
        avatarUrl,
        avatarPublicId,
        updatedAt: serverTimestamp(),
      }
      if (!profile) {
        record.role = "user"
        record.createdAt = serverTimestamp()
      }
      await writeOwnUser(record)
      await updateProfile(user, {
        displayName: name,
        photoURL: avatarUrl || null,
      })
      const oldPublicId = profile?.avatarPublicId || publicIdFromUrl(profile?.avatarUrl)
      if (oldPublicId && avatarPublicId && oldPublicId !== avatarPublicId) deleteOldAvatar(oldPublicId)
      onSaved({ ...record, updatedAt: Date.now() })
    } catch (saveError) {
      setError(saveError.message || "同步失敗")
      setStatus("")
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-3 py-4 sm:px-4 sm:py-8">
      <button
        type="button"
        aria-label="關閉檔案設定"
        disabled={busy}
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
      />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="identity-title"
        onSubmit={save}
        className="dossier-scroll hud-corner relative z-10 my-auto max-h-[calc(100dvh-2rem)] w-[min(32rem,calc(100dvw-1.5rem))] min-w-0 border border-white/15 bg-black p-4 text-ink shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-7"
      >
        <p className="font-mono text-[11px] tracking-[0.22em] text-signal">IDENTITY BINDING // 人員識別檔案</p>
        <h2 id="identity-title" className="mt-2 text-xl font-medium text-ink">
          人員識別檔案綁定終端
        </h2>
        <p className="mt-2 font-mono text-[11px] break-all text-ash">{user.email}</p>
        <p className="mt-1 font-mono text-[11px] tracking-[0.16em] text-ash">
          UID // {profile?.publicUid || "儲存後核發"}
        </p>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div
            className={`relative h-60 w-60 max-w-full shrink-0 overflow-hidden border border-white/15 bg-panel ${editable ? "cursor-grab touch-none" : ""}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {preview ? (
              <img
                ref={imageRef}
                src={preview}
                alt=""
                draggable={false}
                onLoad={(event) => {
                  setNatural({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })
                }}
                className={editable ? "absolute max-w-none" : "h-full w-full object-cover"}
                style={
                  editable
                    ? {
                        width: framed.width,
                        height: framed.height,
                        left: "50%",
                        top: "50%",
                        transform: `translate(calc(-50% + ${framed.x}px), calc(-50% + ${framed.y}px))`,
                      }
                    : undefined
                }
              />
            ) : (
              <span className="flex h-full items-center justify-center font-mono text-xs text-ash">NO IMAGE</span>
            )}
          </div>
          <label className="w-fit cursor-pointer border border-line px-3 py-2 font-mono text-xs tracking-wide text-ink transition-colors hover:border-alert hover:text-alert">
            [ 選擇影像 ]
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={busy}
              onChange={onFile}
            />
          </label>
        </div>
        <p className="mt-2 font-mono text-[10px] tracking-wide text-ash">JPG / PNG / WEBP // 5MB 以內</p>

        {editable && (
          <label className="mt-4 block font-mono text-[11px] tracking-[0.16em] text-ash" htmlFor="avatar-zoom">
            尺寸
            <input
              id="avatar-zoom"
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              disabled={busy}
              onChange={onZoom}
              className="mt-2 block w-full accent-alert"
            />
            <span className="mt-2 block text-[10px] tracking-wide">拖移影像調整位置</span>
          </label>
        )}

        <label className="mt-5 block font-mono text-[11px] tracking-[0.16em] text-ash" htmlFor="account-name">
          帳號名稱
        </label>
        <input
          id="account-name"
          value={displayName}
          maxLength={32}
          disabled={busy}
          onChange={(event) => setDisplayName(event.target.value)}
          className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm text-ink outline-none focus:border-alert"
        />

        {status && <p className="mt-4 font-mono text-[11px] tracking-wide text-signal">{status}</p>}
        {error && <p className="mt-4 font-mono text-[11px] tracking-wide text-alert">{error}</p>}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={busy}
            className="border border-alert px-3 py-2 font-mono text-xs tracking-wide text-alert transition-colors hover:bg-alert hover:text-white disabled:opacity-40"
          >
            [ 儲存並同步檔案 ]
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setCardOpen(true)}
            className="border border-line px-3 py-2 font-mono text-xs tracking-wide text-ink transition-colors hover:border-alert hover:text-alert disabled:opacity-40"
          >
            [ 預覽識別證 ]
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="border border-line px-3 py-2 font-mono text-xs tracking-wide text-ash transition-colors hover:text-ink disabled:opacity-40"
          >
            [ 關閉終端 ]
          </button>
        </div>
      </form>
      {cardOpen && (
        <IdentityCard
          profile={{
            id: user.uid,
            displayName: displayName.trim() || "未命名",
            publicUid: profile?.publicUid || "",
            avatarUrl: preview,
          }}
          onClose={() => setCardOpen(false)}
          onOpenCharacter={(character) => {
            setCardOpen(false)
            onOpenCharacter?.(character)
          }}
        />
      )}
    </div>
  )
}
