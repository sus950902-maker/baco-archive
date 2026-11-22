export default function IdentityCard({ profile, onClose }) {
  const name = profile.displayName || "未命名"
  const publicUid = profile.publicUid || "未核發"
  const photo = profile.avatarUrl || ""

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <button type="button" aria-label="關閉識別證" onClick={onClose} className="absolute inset-0 bg-black/70" />
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="identity-card-title"
        className="relative z-10 w-full max-w-xl border border-[#1a1a1a] bg-[#f4f0e6] text-[#1a1a1a] shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
      >
        <header className="flex items-center justify-between bg-black px-5 py-3 text-white">
          <p className="font-mono text-[11px] tracking-[0.22em]">B.A.C.O. PERSONNEL</p>
          <p id="identity-card-title" className="font-mono text-[11px] tracking-[0.18em]">
            人員識別證
          </p>
        </header>
        <div className="grid grid-cols-[7.5rem_1fr] gap-5 px-5 py-5 sm:grid-cols-[9rem_1fr] sm:px-6">
          <div className="aspect-[3/4] overflow-hidden border border-[#1a1a1a] bg-[#e7e1d4]">
            {photo ? (
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center font-mono text-xs text-[#6d675c]">NO IMAGE</span>
            )}
          </div>
          <div className="flex min-w-0 flex-col justify-between py-1">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-[#6d675c]">NAME // 姓名</p>
              <h2 className="mt-1 truncate text-2xl font-bold">{name}</h2>
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-[#6d675c]">UID // 識別編號</p>
              <p className="mt-1 font-mono text-lg tracking-[0.18em]">{publicUid}</p>
            </div>
            <p className="font-mono text-[10px] tracking-[0.16em] text-[#6d675c]">STATUS // 外部閱覽</p>
          </div>
        </div>
        <footer className="flex items-center justify-between border-t border-[#1a1a1a] px-5 py-3">
          <p className="font-mono text-[10px] tracking-[0.16em] text-[#6d675c]">BUREAU OF ANOMALOUS CONTAINMENT</p>
          <button type="button" onClick={onClose} className="font-mono text-[11px] tracking-wide hover:text-alert">
            [ 關閉 ]
          </button>
        </footer>
      </article>
    </div>
  )
}
