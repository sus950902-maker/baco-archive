import { useEffect, useRef, useState } from "react"
import { doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore"
import { assignFileNumbers, DEPARTMENTS, FACTION_COLOR } from "../characters"
import { db } from "../firebase"
import { deleteStoredImage, publicIdFromUrl, uploadImage } from "../media"
import ImageField from "./ImageField"
import PortraitField from "./PortraitField"

const fieldClass = "mt-2 w-full border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none focus:border-alert"

export default function CharacterEditor({ character, onNotice, onSaved }) {
  const [name, setName] = useState(character.name === "未命名" ? "" : character.name)
  const faction = character.faction
  const [department, setDepartment] = useState(character.department || DEPARTMENTS[4])
  const [bio, setBio] = useState(character.bio || "")
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const [fileNo, setFileNo] = useState(character.fileNo || "")
  const avatarRef = useRef(null)
  const portraitRef = useRef(null)

  useEffect(() => {
    if (faction === "調查員" || faction === "異常") assignFileNumbers(faction).catch(() => {})
    return onSnapshot(doc(db, "characters", character.id), (snap) => {
      setFileNo(snap.exists() ? snap.data().fileNo || "" : "")
    })
  }, [character.id, faction])

  async function save(event) {
    event.preventDefault()
    const nextName = name.trim()
    if (!nextName) {
      setError("請填寫角色名稱")
      return
    }
    setBusy(true)
    setError("")
    try {
      setStatus("影像壓縮中")
      const avatarFile = await avatarRef.current?.prepare()
      const patch = {
        name: nextName,
        department,
        bio: bio.trim(),
        updatedAt: serverTimestamp(),
      }
      if (avatarFile) {
        setStatus("頭像上傳中")
        const uploaded = await uploadImage(avatarFile)
        patch.avatarUrl = uploaded.secure_url
        patch.avatarPublicId = uploaded.public_id
      }
      const portraitUrl = portraitRef.current?.url() || ""
      if (portraitUrl) {
        const next = portraitRef.current.ratio()
        patch.portraitUrl = portraitUrl
        patch.portraitPublicId = ""
        patch.portraitX = next.x
        patch.portraitY = next.y
        patch.portraitScale = next.scale
      } else if (character.portraitUrl) {
        patch.portraitUrl = ""
        patch.portraitPublicId = ""
      }
      setStatus("檔案寫入中")
      await updateDoc(doc(db, "characters", character.id), patch)
      if (avatarFile) deleteStoredImage(character.avatarPublicId || publicIdFromUrl(character.avatarUrl))
      if (character.portraitUrl && portraitUrl !== character.portraitUrl) {
        deleteStoredImage(character.portraitPublicId || publicIdFromUrl(character.portraitUrl))
      }
      onSaved({
        ...character,
        ...patch,
        avatarUrl: patch.avatarUrl || character.avatarUrl,
        avatarPublicId: patch.avatarPublicId || character.avatarPublicId,
        portraitUrl: patch.portraitUrl ?? character.portraitUrl,
        portraitPublicId: patch.portraitPublicId ?? character.portraitPublicId,
        portraitX: patch.portraitX ?? character.portraitX,
        portraitY: patch.portraitY ?? character.portraitY,
        portraitScale: patch.portraitScale ?? character.portraitScale,
        updatedAt: Date.now(),
      })
      setStatus("")
      onNotice({ code: "CHARACTER // UPDATED", message: "角色卡已更新。舊頭像已由新圖取代。" })
    } catch (saveError) {
      setError(saveError.message || "角色卡更新失敗")
      setStatus("")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="reveal-right mb-5">
        <p className="font-mono text-[11px] tracking-[0.22em]" style={{ color: FACTION_COLOR[faction] || "#246b3d" }}>
          CHARACTER FILE // {character.uid} // {faction}
        </p>
        <h2 className="mt-2 text-2xl font-medium sm:text-3xl">編輯角色卡</h2>
      </div>
      <form onSubmit={save} className="panel hud-corner grid gap-4 p-5 sm:p-6">
        <div className="grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
          <label className="font-mono text-[11px] tracking-[0.16em] text-ash">
            角色名稱
            <input value={name} maxLength={32} disabled={busy} onChange={(event) => setName(event.target.value)} className={fieldClass} />
          </label>
          <label className="font-mono text-[11px] tracking-[0.16em] text-ash">
            {faction === "議會" ? "代號" : "編號"}
            <input value={fileNo || "—"} readOnly disabled className={`${fieldClass} cursor-default disabled:opacity-100`} />
          </label>
        </div>
        <p className="font-mono text-[11px] tracking-[0.16em] text-ash">
          陣營 // <span style={{ color: FACTION_COLOR[faction] || "#1a1a1a" }}>{faction}</span>
        </p>
        <label className="font-mono text-[11px] tracking-[0.16em] text-ash">
          所屬部門
          <select value={department} disabled={busy} onChange={(event) => setDepartment(event.target.value)} className={fieldClass}>
            {DEPARTMENTS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="font-mono text-[11px] tracking-[0.16em] text-ash">
          角色簡介
          <textarea value={bio} maxLength={600} disabled={busy} onChange={(event) => setBio(event.target.value)} className={`${fieldClass} min-h-24`} />
        </label>
        <ImageField ref={avatarRef} label="兩吋照片" kind="avatar" existingUrl={character.avatarUrl} disabled={busy} />
        {status && <p className="font-mono text-[11px] text-signal">{status}</p>}
        {error && <p className="font-mono text-[11px] text-alert">{error}</p>}
        <PortraitField
          ref={portraitRef}
          existingUrl={character.portraitUrl}
          ratio={{ x: character.portraitX, y: character.portraitY }}
          scale={character.portraitScale}
          disabled={busy}
        >
          {character.avatarUrl ? (
            <img src={character.avatarUrl} alt="" className="aspect-[7/9] w-16 shrink-0 object-cover" />
          ) : (
            <span className="flex aspect-[7/9] w-16 shrink-0 items-center justify-center bg-black font-mono text-xs text-white">
              {(name || character.name || "?").slice(0, 1)}
            </span>
          )}
          <span>
            <span className="flex items-center gap-2">
              <span className="shrink-0 text-base font-medium">{fileNo || "—"}</span>
              <span className="text-base font-medium">{name.trim() || "未命名"}</span>
            </span>
            <span className="mt-1 block font-mono text-[11px] tracking-wide" style={{ color: FACTION_COLOR[faction] || "#5c5854" }}>
              {faction}
            </span>
            <span className="mt-1 block font-mono text-[11px] text-ash">{department}</span>
            <span className="mt-2 block font-mono text-[10px] tracking-[0.14em] text-ash">UID // {character.uid}</span>
          </span>
        </PortraitField>
        <button type="submit" disabled={busy} className="mx-auto w-fit border border-black px-3 py-2 font-mono text-xs tracking-wide text-ink hover:border-alert hover:text-alert disabled:opacity-40">
          [ 儲存檔案 ]
        </button>
      </form>
    </section>
  )
}
