import { useEffect, useState } from "react"
import { Lock } from "lucide-react"
import GlobeBackdrop from "./GlobeBackdrop"
import Redacted from "./Redacted"

const FILES = [
  { id: "brief", index: "01", code: "DOSSIER BODY", title: "機構簡介" },
  { id: "world", index: "02", code: "WORLD RECORD", title: "世界觀" },
  { id: "anomaly", index: "03", code: "ABOUT ANOMALY", title: "關於異常" },
  { id: "secret", index: "04", code: "OMEGA LOCK", title: "認知封鎖協議", restricted: true },
  { id: "secret-1", index: "05", code: "OMEGA LOCK-1", title: "方舟計畫", restricted: true },
]

const BRIEFING = [
  "我們的世界，遠比所見的更加脆弱。",
  "「常理之外，我們將築高牆；基準之中，唯有秩序永恆。」",
]

const WORLD = [
  "這裡是 21 世紀末，一個科技高度繁榮、超凡潛力並存，卻又無比脆弱的類地球文明。",
  "受歷史異常輻射影響，星球上棲息著人類、改造人、亞人種，甚至是擁有自我意識並以人形融入社會的受控異常個體；但社會的絕大多數民眾依然是毫無防備、沒有特殊能力的普通市民。",
]

const PROTOCOL = [
  "根據本局過往紀錄，某些高危異常具備「觀測者依賴性」與「概念增殖特性」——意即其現實干涉強度與知曉該概念之智慧個體數量呈正相關。一旦特定模因異常突破資訊防火牆並進入現代高密度互聯網中，恐懼情緒與資訊傳播將引發指數級連鎖反應，進而導致大規模認知污染及不可逆的現實結構崩潰。",
]

const bodyClass = "text-base font-[450] leading-8 text-ink sm:text-[17px]"

export default function Hero({ user, onNotice }) {
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    if (!user) {
      setOpenId((current) => (FILES.find((file) => file.id === current)?.restricted ? null : current))
    }
  }, [user])

  function toggleFile(id) {
    if (FILES.find((file) => file.id === id)?.restricted && !user) {
      onNotice?.({ code: "CLEARANCE // DENIED", message: "權限不足。本檔列管中，請登入後再行調閱。" })
      return
    }
    setOpenId((current) => (current === id ? null : id))
  }

  return (
    <section id="overview" className="mx-auto max-w-6xl scroll-mt-36 px-4 pt-10 pb-40 sm:px-6 sm:pt-14 sm:pb-56">
      <div className="relative mx-auto mb-6 h-[26rem] w-full max-w-[26rem] sm:h-[34rem] sm:max-w-[34rem]">
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
          const locked = file.restricted && !user
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
                    {locked && <Lock className="h-3.5 w-3.5" aria-hidden="true" />}
                    {file.index}
                  </span>
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3 sm:px-5">
                    <span className="min-w-0">
                      <span className="block font-mono text-[11px] tracking-[0.22em] text-ash">
                        {file.code}
                      </span>
                      <span className={`mt-1 block text-lg font-bold ${locked ? "text-[#9a958c]" : "text-ink"}`}>
                        {locked ? "權限不足" : file.title}
                      </span>
                    </span>
                    <span className={`shrink-0 font-mono text-[11px] tracking-[0.16em] ${locked ? "text-alert" : "text-ash"}`}>
                      {locked ? "LOCKED" : open ? "OPEN" : "SEALED"}
                    </span>
                  </span>
                </button>
                <div className={`faction-expand ${open ? "is-open" : ""}`} aria-hidden={!open}>
                  <div>
                    {!locked && (
                      <div className="border-t border-[#d6d1c7] px-5 py-5 sm:px-8 sm:py-7">
                        {file.id === "brief" ? (
                          <div className="space-y-4">
                            <p className="text-base font-bold leading-8 text-alert sm:text-[17px]">{BRIEFING[0]}</p>
                            <p className={bodyClass}>
                              異常收容與觀測調查局
                              <span className="text-ash">
                                （Bureau of Anomalous Containment, Observation and Investigation，簡稱：異常管理局｜B.A.C.O.）
                              </span>
                              為專責維護人類現實防線之最高機密機構。本機構之核心設立目標，在於常理之外建立絕對秩序：針對一切試圖破壞現實法則、引發大規模混亂的未明異常現象與實體，執行全天候觀測、即時阻斷與最高規格收容，確保所有失控變數被重新鎖閉於防護網之內。
                            </p>
                            <p className={bodyClass}>{BRIEFING[1]}</p>
                          </div>
                        ) : file.id === "anomaly" ? (
                          <div className="space-y-4">
                            <p className={bodyClass}>
                              自古以來，人類一直在與「<span className="font-bold">異常</span>」抗衡。
                            </p>
                            <p className={bodyClass}>
                              無人知曉它們的真正源頭，有人稱其為世界規則的致命漏洞，也有人認為是高維混沌滲入現實的裂痕。如今大眾口耳相傳的神話禁忌、民間鬼怪與網路怪談，大多都是過去異常事件外洩後留下的歷史殘影。
                            </p>
                            <p className={bodyClass}>
                              B.A.C.O. 嚴禁向公眾揭露真相。因為在這個資訊高度互聯的時代，一旦「
                              <Redacted>██████</Redacted>
                              」隨著恐懼與認知在人群中擴散，文明將
                              <Redacted>███████</Redacted>
                              。我們抹除痕跡、備份
                              <Redacted>████</Redacted>
                              、穩定現實——只為讓陽光之下的普通人，永遠不必知曉黑暗中究竟存在著什麼。
                            </p>
                          </div>
                        ) : file.id === "secret" ? (
                          <div className="space-y-4">
                            <p className={bodyClass}>
                              異常管理局B.A.C.O.對一切超常現象實施最高等級的資訊封鎖政策。此項保密協議並非單純基於社會學層面上的「避免群體恐慌」，而是建立在對認知危害型異常
                              <span className="text-ash">（Cognitohazardous Anomalies）</span>
                              與模因級概念體
                              <span className="text-ash">（Memetic Entities）</span>
                              的預防措施。
                            </p>
                            {PROTOCOL.map((paragraph) => (
                              <p key={paragraph} className={bodyClass}>
                                {paragraph}
                              </p>
                            ))}
                            <p className="text-base font-bold leading-8 text-alert sm:text-[17px]">
                              因此，維持公眾對異常現象的「零認知」，為確保文明存續之首要前提。
                            </p>
                          </div>
                        ) : file.id === "world" ? (
                          <div className="space-y-4">
                            {WORLD.map((paragraph, index) => (
                              <p
                                key={paragraph}
                                className={`text-base leading-8 text-ink sm:text-[17px] ${index === 0 ? "font-bold" : "font-[450]"}`}
                              >
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        ) : file.id === "secret-1" ? (
                          <div className="space-y-4">
                            <p className={bodyClass}>
                              為確保一般民眾得以在異常威脅下正常生活並維持社會穩定，異常收容與觀測調查局
                              <span className="text-ash">（B.A.C.O.）</span>
                              於全球資訊基建與醫療體系底層，建立了一套最高機密的多層次「<span className="font-bold">現實掩護網</span>」——內部代號：「<span className="font-bold">方舟計畫</span>」。
                            </p>
                            <p className={bodyClass}>
                              在認知與資訊管制層面，針對意外目擊異常之平民倖存者，以及在第一線遭遇精神污染之調查人員，本局將強制執行<span className="font-bold">局部記憶清洗與認知覆寫程序</span>
                              <span className="text-ash">（Mnemonic Erasure Protocol）</span>
                              。同時，情報管制部門會透過演算法與主流媒體管道，將所有異常災害的物理痕跡統一擬態為「高壓管線氣爆」、「極端氣象異常」、「集體心因性幻覺」或「地方傳染病」等常規世俗事件，徹底切斷公眾與異常之間的認知連結。
                            </p>
                            <p className={bodyClass}>
                              在生命維持與人口統計層面，「<span className="font-bold">方舟計畫</span>」亦包含與全球公衛機構簽訂的秘密協定，於全體市民的定期健康檢查中植入「<span className="font-bold">神經突觸與基因序列即時備份模組</span>」。一旦民眾不幸於異常災害中發生生物性死亡，後勤部門將秘密啟動「<span className="font-bold">重構列印終端</span>
                              <span className="text-ash">（Reconstruction Terminal）</span>
                              」，依據最新備份數據重新打印生物軀殼，並精準切除死亡前後之異常接觸記憶後送返原社會軌跡，藉此從統計學層面徹底抹除「<span className="font-bold">非自然失蹤率</span>」，維持表層世界之絕對穩定。
                            </p>
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
