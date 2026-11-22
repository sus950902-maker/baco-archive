import GlobeBackdrop from "./GlobeBackdrop"

const BRIEFING = [
  "我們的世界，遠比所見的更加脆弱。",
  "「在常理的盲區，我們築起高牆；抹除異常、校準現實、守望秩序、維護永恆。」",
]

export default function Hero() {
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

      <div className="reveal-right panel hud-corner p-5 sm:p-8">
        <div>
          <p className="mb-4 font-mono text-[11px] tracking-[0.22em] text-ash">
            DOSSIER BODY // 機構簡介
          </p>
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
        </div>
      </div>
    </section>
  )
}
