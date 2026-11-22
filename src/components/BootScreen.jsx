import { useEffect } from "react"

const LINES = [
  "B.A.C.O. INTERNAL ARCHIVE // BOOT SEQUENCE",
  "> ESTABLISHING SECURE CHANNEL",
  "> CLEARANCE ................ GUEST",
  "> MOUNT DOSSIER ████ ....... OK",
  "> INTERFACE ONLINE",
]

export default function BootScreen({ onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1500)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <button
      type="button"
      onClick={onDone}
      className="fixed inset-0 z-50 flex items-center justify-center bg-void px-6 text-left"
      aria-label="跳過系統載入"
    >
      <div className="w-full max-w-xl font-mono text-sm leading-8">
        {LINES.map((line, index) => (
          <p
            key={line}
            className="boot-line text-signal"
            style={{ animationDelay: `${index * 140}ms` }}
          >
            {line}
          </p>
        ))}
        <p className="boot-line mt-6 text-xs text-ash" style={{ animationDelay: "700ms" }}>
          CLICK TO SKIP // 點擊略過載入
        </p>
      </div>
    </button>
  )
}
