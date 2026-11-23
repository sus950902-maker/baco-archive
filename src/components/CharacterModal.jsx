import { useEffect } from "react"
import { createPortal } from "react-dom"
import { FACTION_COLOR } from "../characters"

export default function CharacterModal({ character, user, staff, onClose, onEdit }) {
  const canEdit = Boolean(onEdit) && Boolean(user) && (staff || character.ownerUid === user?.uid)
  const tone = FACTION_COLOR[character.faction] || "#e2e8f0"

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
        className="dossier-scroll hud-corner relative z-10 my-auto max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100dvw-1.5rem))] border border-white/15 bg-black p-4 text-ink shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-7"
      >
        <p className="font-mono text-[11px] tracking-[0.22em]" style={{ color: tone }}>
          CHARACTER FILE // {character.uid}
        </p>
        <h2 id="character-title" className="mt-2 text-xl font-medium text-ink">
          {character.name || "未命名"}
        </h2>
        <p className="mt-2 font-mono text-[11px] tracking-[0.14em] text-ash">
          {character.faction} // {character.department || "無 / 民間"}
        </p>
        {character.ownerName && <p className="mt-1 font-mono text-[11px] text-ash">持有者 // {character.ownerName}</p>}
        {character.bio && <p className="mt-4 text-sm leading-7 text-ink">{character.bio}</p>}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <figure>
            <figcaption className="font-mono text-[10px] tracking-[0.16em] text-ash">AVATAR</figcaption>
            {character.avatarUrl ? (
              <img src={character.avatarUrl} alt="" className="mt-2 h-40 w-40 border border-white/15 object-cover" />
            ) : (
              <p className="mt-2 font-mono text-xs text-ash">NO IMAGE</p>
            )}
          </figure>
          <figure>
            <figcaption className="font-mono text-[10px] tracking-[0.16em] text-ash">ID CARD // 角色識別證</figcaption>
            {character.idCardUrl ? (
              <img src={character.idCardUrl} alt={`${character.name} 識別證`} className="mt-2 max-h-80 w-full border border-white/15 object-contain" />
            ) : (
              <p className="mt-2 font-mono text-xs text-ash">NO IMAGE</p>
            )}
          </figure>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(character)}
              className="border border-alert px-3 py-2 font-mono text-xs tracking-wide text-alert hover:bg-alert hover:text-white"
            >
              [ 編輯角色檔案 / 更換頭像與識別證 ]
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
