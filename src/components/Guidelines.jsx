import { useEffect, useRef, useState } from "react"
import { Crosshair, Eye, Landmark, Users } from "lucide-react"

const FACTIONS = [
  {
    id: "anomaly",
    icon: Eye,
    color: "#f59e0b",
    name: "異常",
    role: "玩家可參與陣營",
    body: "透過繪製並上傳『異常災害』作品展現異常能力與擴大影響。若名下災害事件被全數被解決（威脅分數歸0），將進入『收容狀態』，『收容狀態』無法發布『異常災害』，需繪製『突破收容』作品解除此限制。",
  },
  {
    id: "public",
    icon: Users,
    color: "#38bdf8",
    name: "民眾",
    role: "玩家可參與陣營",
    body: "",
  },
  {
    id: "investigator",
    icon: Crosshair,
    color: "#10b981",
    name: "調查員",
    role: "玩家可參與陣營（隸屬 B.A.C.O.）",
    body: "深入第一線勘查，針對未解決事件繪製『異常處理』圖作，以交戰、封鎖或干擾壓制異常。",
  },
  {
    id: "council",
    icon: Landmark,
    color: "#dc2626",
    name: "議會",
    role: "官方工作人員（隸屬 B.A.C.O.）",
    body: "幕後最高審查機構，負責評估異常事件威脅分數、判定異常災害處理結果、維護社群秩序與推進活動進程。",
  },
]

function TypedBody({ text, active }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return undefined
    setCount(0)
    let index = 0
    const timer = window.setInterval(() => {
      index += 1
      setCount(index)
      if (index >= text.length) window.clearInterval(timer)
    }, 12)
    return () => window.clearInterval(timer)
  }, [active, text])

  const shown = text.slice(0, active ? count : text.length)

  return (
    <p className="relative mt-3 text-base font-[450] leading-7 text-ash transition-colors duration-300 group-hover:text-black group-focus-within:text-black">
      <span className="invisible">{text}</span>
      <span className="absolute inset-0">{shown}</span>
    </p>
  )
}

export default function Guidelines() {
  const [openId, setOpenId] = useState(null)
  const cardsRef = useRef(null)

  useEffect(() => {
    if (!openId) return undefined
    const onPointerDown = (event) => {
      if (cardsRef.current?.contains(event.target)) return
      setOpenId(null)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [openId])

  function openFaction(id) {
    setOpenId(id)
  }

  return (
    <section id="guidelines" className="mx-auto max-w-6xl scroll-mt-36 px-4 pb-16 sm:px-6 sm:pb-56">
      <div className="reveal-right mb-4 flex flex-wrap items-end justify-between gap-2 sm:mb-5 sm:gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.18em] text-comment sm:tracking-[0.28em]">SECTOR 02 // PROTOCOL</p>
          <h2 className="mt-2 text-2xl font-medium text-ink sm:text-3xl">企劃玩法</h2>
        </div>
        <p className="font-mono text-[11px] text-ash">FILE LOCK: READ ONLY // GUEST</p>
      </div>

      <div className="reveal-right panel hud-corner mb-4 p-4 sm:mb-6 sm:p-8">
        <p className="font-mono text-[11px] tracking-[0.18em] text-ash sm:tracking-[0.22em]">PLAY OVERVIEW // 玩法概述</p>
        <p className="mt-3 max-w-3xl text-base font-[450] leading-7 text-ink sm:mt-4 sm:text-[17px] sm:leading-8">
          在脆弱的現實防線下，你可以選擇成為破壞規則、引發混亂的異常；挺身封鎖災變、時刻處在死亡邊緣的調查員；或是生活在日常秩序中，卻意外捲入事件的民眾...
        </p>
      </div>

      <div id="guidelines-panel" className="panel hud-corner p-4 sm:p-7">
        <div className="space-y-3 sm:space-y-4">
          <p className="font-mono text-[11px] tracking-[0.18em] text-ash sm:tracking-[0.22em]">FACTION INDEX // 陣營</p>
          <div ref={cardsRef} className="grid gap-2 sm:gap-3">
            {FACTIONS.map((faction) => {
              const Icon = faction.icon
              const open = openId === faction.id
              return (
                <div key={faction.name} className="reveal-right">
                  <article
                    style={{ "--faction-color": faction.color }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={open}
                    onClick={() => openFaction(faction.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        openFaction(faction.id)
                      }
                    }}
                    className={`faction-card group flex cursor-pointer items-stretch rounded-sm border text-left ${open ? "is-open" : ""}`}
                  >
                    <div className="faction-swatch relative z-10 flex w-11 min-h-11 shrink-0 items-center justify-center self-stretch sm:w-12 sm:min-h-12">
                      <Icon className="h-5 w-5 text-white sm:h-6 sm:w-6" aria-hidden="true" />
                    </div>
                    <div className="faction-copy relative z-10 flex min-w-0 flex-1 flex-col justify-center px-3.5 py-2 sm:px-5">
                      <h4 className="faction-tone text-lg font-bold">{faction.name}</h4>
                      <div className={`faction-expand ${open ? "is-open" : ""}`} aria-hidden={!open}>
                        <div>
                          {faction.role && (
                            <p className="faction-tone mt-1 font-mono text-[11px] tracking-wide">{faction.role}</p>
                          )}
                          {faction.id === "anomaly" ? (
                            <div className="mt-3 text-base font-[450] leading-7 text-ash transition-colors duration-300 group-hover:text-black group-focus-within:text-black">
                              <p>
                                透過繪製並上傳<span className="font-bold">『異常災害』</span>
                                作品展現異常能力與擴大影響。若名下災害事件被全數被解決（威脅分數歸0），將進入
                                <span className="font-bold">『收容狀態』</span>，<span className="font-bold">『收容狀態』</span>
                                無法發布<span className="font-bold">『異常災害』</span>，需繪製
                                <span className="font-bold">『突破收容』</span>作品解除此限制。
                              </p>
                            </div>
                          ) : (
                            faction.body && <TypedBody text={faction.body} active={open} />
                          )}
                        </div>
                      </div>
                    </div>
                    <Icon className="faction-mark" aria-hidden="true" />
                  </article>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
