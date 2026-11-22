export default function IdentityCard({ profile, onClose }) {
  const name = profile.displayName || "未命名"
  const publicUid = profile.publicUid || "未核發"
  const photo = profile.avatarUrl || ""

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto px-3 py-4 sm:px-4 sm:py-8">
      <button type="button" aria-label="關閉識別證" onClick={onClose} className="absolute inset-0 bg-black/70" />
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="identity-card-title"
        className="relative z-10 my-auto max-h-[calc(100dvh-2rem)] w-[min(36rem,calc(100dvw-1.5rem))] min-w-0 overflow-y-auto border border-[#1a1a1a] bg-white text-[#1a1a1a] shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
      >
        <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 bg-black px-3 py-3 text-white sm:px-5">
          <p className="min-w-0 font-mono text-[10px] tracking-[0.12em] sm:text-[11px] sm:tracking-[0.22em]">B.A.C.O. PERSONNEL</p>
          <p id="identity-card-title" className="font-mono text-[10px] tracking-[0.12em] sm:text-[11px] sm:tracking-[0.18em]">
            人員識別證
          </p>
        </header>
        <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 px-3 py-4 sm:grid-cols-[9rem_1fr] sm:gap-5 sm:px-6 sm:py-5">
          <div className="aspect-[3/4] overflow-hidden border border-[#1a1a1a] bg-[#f4f4f4]">
            {photo ? (
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center font-mono text-xs text-[#6d675c]">NO IMAGE</span>
            )}
          </div>
          <div className="flex min-w-0 flex-col justify-between gap-3 py-1">
            <div className="min-w-0">
              <p className="font-mono text-[10px] tracking-[0.12em] text-[#6d675c] sm:tracking-[0.2em]">NAME // 姓名</p>
              <h2 className="mt-1 break-words text-xl font-bold sm:truncate sm:text-2xl">{name}</h2>
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] tracking-[0.12em] text-[#6d675c] sm:tracking-[0.2em]">UID // 識別編號</p>
              <p className="mt-1 break-all font-mono text-base tracking-[0.08em] sm:text-lg sm:tracking-[0.18em]">{publicUid}</p>
            </div>
            <p className="font-mono text-[10px] tracking-[0.08em] text-[#6d675c] sm:tracking-[0.16em]">STATUS // 外部閱覽</p>
          </div>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#1a1a1a] px-3 py-3 sm:px-5">
          <p className="min-w-0 flex-1 font-mono text-[9px] leading-4 tracking-[0.06em] text-[#6d675c] sm:text-[10px] sm:tracking-[0.16em]">
            BUREAU OF ANOMALOUS CONTAINMENT
          </p>
          <button type="button" onClick={onClose} className="shrink-0 font-mono text-[11px] tracking-wide hover:text-alert">
            [ 關閉 ]
          </button>
        </footer>
      </article>
    </div>
  )
}
