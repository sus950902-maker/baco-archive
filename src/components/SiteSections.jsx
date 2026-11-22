const SECTIONS = [
  {
    id: "play",
    code: "SECTOR 03 // FIELD PLAY",
    title: "企劃須知",
    file: "FILE STATUS // COMPILING",
    body: "本區玩法檔案建置中。",
  },
  {
    id: "social",
    code: "SECTOR 04 // UPLINK",
    title: "社群媒體",
    file: "CHANNEL INDEX // STANDBY",
    body: "對外頻道整理中。",
  },
  {
    id: "protocol",
    code: "SECTOR 05 // DIRECTIVE",
    title: "協議聲明",
    file: "B.A.C.O. SECURITY PROTOCOL",
    body: "未經授權嚴禁外流檔案內容。本檔案僅供授權人員於內部封存系統內閱覽，任何複製、轉載或對外散佈均視為違反收容協議。",
  },
]

export default function SiteSections() {
  return (
    <>
      {SECTIONS.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="mx-auto max-w-6xl scroll-mt-36 px-4 pb-40 sm:px-6 sm:pb-56"
        >
          <div className="reveal-right mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] tracking-[0.28em] text-comment">{section.code}</p>
              <h2 className="mt-2 text-2xl font-medium text-ink sm:text-3xl">{section.title}</h2>
            </div>
            <p className="font-mono text-[11px] text-ash">FILE LOCK: READ ONLY // GUEST</p>
          </div>
          <div className="reveal-right panel hud-corner p-5 sm:p-8">
            <p className="font-mono text-[11px] tracking-[0.22em] text-ash">{section.file}</p>
            <p className="mt-4 max-w-3xl text-base font-[450] leading-8 text-ink sm:text-[17px]">{section.body}</p>
          </div>
        </section>
      ))}
    </>
  )
}
