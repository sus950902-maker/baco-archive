import { useEffect, useState } from "react"
import { Crosshair, Eye, Landmark, Users } from "lucide-react"

const FACTIONS = [
  {
    id: "anomaly",
    icon: Eye,
    color: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.72)",
    name: "異常",
    role: "玩家可參與陣營",
    body: "潛伏於現實並製造混亂，透過繪製『異常事件』展現能力與擴大影響。若名下事件全數被解決，將進入『收容狀態』，需繪製『突破收容』作品方可解除限制。",
  },
  {
    id: "public",
    icon: Users,
    color: "#38bdf8",
    glow: "rgba(56, 189, 248, 0.72)",
    name: "民眾",
    role: "玩家可參與陣營",
    body: "",
  },
  {
    id: "investigator",
    icon: Crosshair,
    color: "#10b981",
    glow: "rgba(16, 185, 129, 0.72)",
    name: "調查員",
    role: "玩家可參與陣營（隸屬 B.A.C.O.）",
    body: "深入第一線勘查，針對未解決事件繪製『異常處理』圖作，以交戰、封鎖或干擾壓制異常。",
  },
  {
    id: "council",
    icon: Landmark,
    color: "#dc2626",
    glow: "rgba(220, 38, 38, 0.72)",
    name: "議會",
    role: "官方工作人員（隸屬 B.A.C.O.）",
    body: "幕後最高審查機構，負責評估事件威脅分數、判定處理結果與推進主線。",
  },
]

function TypedBody({ text, active }) {
  const [count, setCount] = useState(0)
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches

  useEffect(() => {
    if (!active) return undefined
    if (reduce) {
      setCount(text.length)
      return undefined
    }
    setCount(0)
    let index = 0
    const timer = window.setInterval(() => {
      index += 1
      setCount(index)
      if (index >= text.length) window.clearInterval(timer)
    }, 12)
    return () => window.clearInterval(timer)
  }, [active, reduce, text])

  const shown = text.slice(0, active ? count : text.length)

  return (
    <p className="relative mt-3 font-[450] leading-7 text-ash transition-colors duration-300 group-hover:text-black group-focus-within:text-black">
      <span className="invisible">{text}</span>
      <span className="absolute inset-0">{shown}</span>
    </p>
  )
}

export default function Guidelines() {
  const [openId, setOpenId] = useState(null)

  function toggleFaction(id) {
    setOpenId((current) => (current === id ? null : id))
  }

  return (
    <section id="guidelines" className="mx-auto max-w-6xl scroll-mt-36 px-4 pb-40 sm:px-6 sm:pb-56">
      <div className="reveal-right mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.28em] text-comment">SECTOR 02 // PROTOCOL</p>
          <h2 className="mt-2 text-2xl font-medium text-ink sm:text-3xl">企劃玩法</h2>
        </div>
        <p className="font-mono text-[11px] text-ash">FILE LOCK: READ ONLY // GUEST</p>
      </div>

      <div className="reveal-right panel hud-corner mb-6 p-5 sm:p-8">
        <p className="font-mono text-[11px] tracking-[0.22em] text-ash">PLAY OVERVIEW // 玩法概述</p>
        <p className="mt-4 max-w-3xl text-base font-[450] leading-8 text-ink sm:text-[17px]">
          在脆弱的現實防線下，你可以選擇成為破壞規則、引發混亂的異常；挺身封鎖災變、時刻處在死亡邊緣的調查員；或是生活在日常秩序中，卻意外捲入事件的民眾...
        </p>
      </div>

      <div id="guidelines-panel" className="panel hud-corner p-5 sm:p-7">
        <div className="space-y-4">
          <p className="font-mono text-[11px] tracking-[0.22em] text-ash">FACTION INDEX // 陣營</p>
          <div className="grid gap-3">
            {FACTIONS.map((faction) => {
              const Icon = faction.icon
              const open = openId === faction.id
              return (
                <div key={faction.name} className="reveal-right">
                  <article
                    style={{ "--faction-glow": faction.glow, "--faction-color": faction.color }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={open}
                    onClick={() => toggleFaction(faction.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        toggleFaction(faction.id)
                      }
                    }}
                    className={`faction-card group flex cursor-pointer items-stretch rounded-sm border text-left ${open ? "is-open" : ""}`}
                  >
                    <div className="faction-swatch relative z-10 flex w-12 min-h-12 shrink-0 items-center justify-center self-stretch">
                      <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-center px-4 py-2 sm:px-5">
                      <h4 className="faction-tone text-lg font-bold">{faction.name}</h4>
                      <div className={`faction-expand ${open ? "is-open" : ""}`} aria-hidden={!open}>
                        <div>
                          {faction.role && (
                            <p className="faction-tone mt-1 font-mono text-[11px] tracking-wide">{faction.role}</p>
                          )}
                          {faction.body && <TypedBody text={faction.body} active={open} />}
                        </div>
                      </div>
                    </div>
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
