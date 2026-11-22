import { useEffect, useState } from "react"
import { Lock } from "lucide-react"
import GlobeBackdrop from "./GlobeBackdrop"

const FILES = [
  { id: "brief", index: "01", code: "DOSSIER BODY", title: "機構簡介" },
  { id: "world", index: "02", code: "WORLD RECORD", title: "世界觀" },
  { id: "secret", index: "03", code: "OMEGA LOCK", title: "最高機密協議" },
]

const BRIEFING = [
  "我們的世界，遠比所見的更加脆弱。",
  "「常理之外，我們將築起高牆；基準之中，唯有秩序永恆。」",
]

export default function Hero({ user, onNotice }) {
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    if (!user) setOpenId((current) => (current === "secret" ? null : current))
  }, [user])

  function toggleFile(id) {
    if (id === "secret" && !user) {
      onNotice?.({ code: "CLEARANCE // DENIED", message: "權限不足" })
      return
    }
    setOpenId((current) => (current === id ? null : id))
  }

  return (
    <section id="overview" className="mx-auto max-w-6xl scroll-mt-36 px-4 pt-10 pb-40 sm:px-6 sm:pt-14 sm:pb-56">
      <div className="relative mx-auto mb-6 h-[26rem] w-[26rem] max-w-full sm:h-[34rem] sm:w-[34rem]">
        <div className="pointer-events-none absolute inset-0">
          <GlobeBackdrop />
        </div>
        <img
          src="/logo4.png"
          alt="異常收容與觀測調查局｜B.A.C.O."
          className="absolute top-1/2 left-1/2 z-10 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 object-contain"
        />
      </div>

      <div className="reveal-right mb-16 text-center sm:mb-24">
        <h1 className="text-3xl font-bold leading-tight text-ink sm:text-5xl">異常收容與觀測調查局</h1>
        <p className="mt-3 font-mono text-sm leading-relaxed text-ash">
          Bureau of Anomalous Containment, Observation and Investigation
        </p>
      </div>

      <div className="grid gap-3">
        {FILES.map((file) => {
          const locked = file.id === "secret" && !user
          const open = openId === file.id && !locked
          return (
            <div key={file.id} className="reveal-right">
              <article className="panel hud-corner">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-disabled={locked}
                  onClick={() => toggleFile(file.id)}
                  className={`flex w-full items-stretch text-left ${locked ? "cursor-not-allowed" : ""}`}
                >
                  <span
                    className={`flex w-14 shrink-0 flex-col items-center justify-center gap-1 font-mono text-sm tracking-wide text-white ${locked ? "bg-[#9a958c]" : "bg-black"}`}
                  >
                    {file.id === "secret" && <Lock className="h-3.5 w-3.5" aria-hidden="true" />}
                    {file.index}
                  </span>
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3 sm:px-5">
                    <span className="min-w-0">
                      <span className="block font-mono text-[11px] tracking-[0.22em] text-ash">
                        {file.code}
                      </span>
                      <span className={`mt-1 block text-lg font-bold ${locked ? "text-[#9a958c]" : "text-ink"}`}>
                        {file.title}
                      </span>
                    </span>
                    <span className={`shrink-0 font-mono text-[11px] tracking-[0.16em] ${locked ? "text-alert" : "text-ash"}`}>
                      {locked ? "LOCKED" : open ? "OPEN" : "SEALED"}
                    </span>
                  </span>
                </button>
                <div className={`faction-expand ${open ? "is-open" : ""}`} aria-hidden={!open}>
                  <div>
                    {open && (
                    <div className="border-t border-[#d6d1c7] px-5 py-5 sm:px-8 sm:py-7">
                      {file.id === "brief" ? (
                        <div className="space-y-4">
                          <p className="text-base font-bold leading-8 text-alert sm:text-[17px]">{BRIEFING[0]}</p>
                          <p className="text-base font-[450] leading-8 text-ink sm:text-[17px]">
                            異常收容與觀測調查局
                            <span className="text-ash">
                              （Bureau of Anomalous Containment, Observation and Investigation，簡稱：異常管理局｜B.A.C.O.）
                            </span>
                            為專責維護人類現實防線之最高機密機構。本機構之核心設立目標，在於常理之外建立絕對秩序：針對一切試圖破壞現實法則、引發大規模混亂的未明異常現象與實體，執行全天候觀測、即時阻斷與最高規格收容，確保所有失控變數被重新鎖閉於防護網之內。
                          </p>
                          <p className="text-base font-[450] leading-8 text-ink sm:text-[17px]">{BRIEFING[1]}</p>
                        </div>
                      ) : (
                        <p className="font-mono text-[11px] tracking-[0.22em] text-ash">FILE STATUS // COMPILING</p>
                      )}
                    </div>
                    )}
                  </div>
                </div>
              </article>
            </div>
          )
        })}
      </div>
    </section>
  )
}
