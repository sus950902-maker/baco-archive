import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { doc, getDoc } from "firebase/firestore"
import { characterTitle, FACTION_COLOR, factionHasDepartment, factionLabel, publicCharacter } from "../characters"
import { db } from "../firebase"
import PortraitArt from "./PortraitArt"

export default function CharacterModal({ character, user, staff, onClose, onEdit }) {
  const [detail, setDetail] = useState(null)
  const shown = detail?.id === character.id ? detail : character
  const canEdit = Boolean(onEdit) && Boolean(user) && (staff || shown.ownerUid === user?.uid)
  const tone = FACTION_COLOR[shown.faction] || "#e2e8f0"

  useEffect(() => {
    if ("bio" in character) return undefined
    let cancel = false
    getDoc(doc(db, "characters", character.id))
      .then((snap) => {
        if (cancel || !snap.exists()) return
        setDetail(publicCharacter(snap.id, snap.data()))
      })
      .catch(() => {})
    return () => {
      cancel = true
    }
  }, [character])

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto px-3 py-4 sm:px-4">
      <button type="button" aria-label="關閉角色檔案" onClick={onClose} className="absolute inset-0 bg-black/70" />
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="character-title"
        className="dossier-scroll hud-corner relative z-10 my-auto max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100dvw-1.5rem))] border border-white/15 bg-black px-4 pt-16 pb-4 text-ink shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:px-7 sm:pt-20 sm:pb-7"
      >
        <div className={`relative -mr-4 overflow-visible sm:-mr-7 ${shown.portraitUrl ? "min-h-[var(--portrait-h)] pr-[var(--portrait-w)]" : ""}`}>
          <div data-card-copy className="w-max max-w-full pr-4">
            <p className="font-mono text-[11px] tracking-[0.22em]" style={{ color: tone }}>
              UID：{shown.uid}
            </p>
            <h2 id="character-title" className="mt-2 text-xl font-medium text-ink">
              {characterTitle(shown)}
            </h2>
            <p className="mt-2 font-mono text-[11px] tracking-[0.14em] text-ash">
              {factionLabel(shown)}
              {factionHasDepartment(shown.faction) ? ` // ${shown.department || "無 / 民間"}` : ""}
            </p>
            {shown.ownerName && <p className="mt-1 font-mono text-[11px] text-ash">持有者 // {shown.ownerName}</p>}
          </div>
          <PortraitArt
            url={shown.portraitUrl}
            ratio={{ x: shown.portraitX, y: shown.portraitY }}
            scale={shown.portraitScale}
            frameClass=""
          />
        </div>
        {shown.bio && <p className="mt-4 text-sm leading-7 text-ink">{shown.bio}</p>}
        <figure className="mt-5">
          <figcaption className="font-mono text-[10px] tracking-[0.16em] text-ash">兩吋照片</figcaption>
          {shown.avatarUrl ? (
            <img src={shown.avatarUrl} alt="" className="mt-2 aspect-[7/9] w-36 border border-white/15 object-cover" />
          ) : (
            <p className="mt-2 font-mono text-xs text-ash">NO IMAGE</p>
          )}
        </figure>
        <div className="mt-6 flex flex-wrap gap-3">
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(shown)}
              className="border border-alert px-3 py-2 font-mono text-xs tracking-wide text-alert hover:bg-alert hover:text-white"
            >
              [ 編輯角色檔案 / 更換兩吋照片 ]
            </button>
          )}
          <button type="button" onClick={onClose} className="border border-white/15 px-3 py-2 font-mono text-xs tracking-wide text-ash hover:text-ink">
            [ 關閉終端 ]
          </button>
        </div>
      </article>
    </div>,
    document.body,
  )
}
