import { useEffect, useMemo, useRef, useState } from "react"

const BOOT_KEY = "baco-boot-seen"

const BOOT_LINES = [
  [{ text: "B.A.C.O. INTERNAL ARCHIVE // BOOT SEQUENCE" }],
  [{ text: "> ESTABLISHING SECURE CHANNEL  " }, { type: "bar" }],
  [{ text: "> CLEARANCE ................ " }, { text: "GUEST", tone: "guest" }],
  [{ text: "> MOUNT DOSSIER " }, { text: "████", tone: "redact" }, { text: " ....... " }, { text: "OK", tone: "ok" }],
  [{ text: "> INTERFACE ONLINE", tone: "ok" }],
]

function authLines(subject, clearance) {
  return [
    [{ text: "> INCOMING BIOMETRIC SIGNATURE..." }],
    [{ text: "> VERIFYING GOOGLE CREDENTIALS  " }, { type: "bar" }, { text: "  " }, { text: "OK", tone: "ok" }],
    [{ text: "> SUBJECT: " }, { text: subject || "UNKNOWN", tone: "subject" }],
    [{ text: "> ASSIGNING CLEARANCE ............... " }, { text: clearance || "BASIC", tone: clearanceTone(clearance) }],
    [{ text: "> DECRYPTING ARCHIVE " }, { text: "████████", tone: "redact" }, { text: " ....... " }, { text: "ACCESS GRANTED", tone: "ok" }],
  ]
}

function clearanceTone(clearance) {
  if (clearance === "COUNCIL") return "council"
  if (clearance === "INTERMEDIATE") return "ok"
  if (clearance === "RESTRICTED") return "restricted"
  return "guest"
}

function lineLength(tokens) {
  return tokens.reduce((total, token) => total + (token.type === "bar" ? 10 : token.text.length), 0)
}

export function markBootPlayed() {
  try {
    sessionStorage.setItem(BOOT_KEY, "1")
  } catch {
    // 分頁儲存不可用時，這次開啟仍照常播放。
  }
}

export function bootAlreadyPlayed() {
  try {
    return sessionStorage.getItem(BOOT_KEY) === "1"
  } catch {
    return false
  }
}

export default function BootSequenceModal({ mode = "boot", subject = "", clearance = "BASIC", onDone }) {
  const lines = useMemo(() => (mode === "auth" ? authLines(subject, clearance) : BOOT_LINES), [mode, subject, clearance])
  const lengths = useMemo(() => lines.map(lineLength), [lines])
  const total = useMemo(() => lengths.reduce((sum, length) => sum + length, 0), [lengths])
  const [count, setCount] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const doneRef = useRef(false)
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    if (mode === "boot") markBootPlayed()
  }, [mode])

  useEffect(() => {
    if (leaving) return undefined
    const step = mode === "auth" ? Math.max(6, Math.round(1400 / Math.max(total, 1))) : 22
    const timer = window.setInterval(() => {
      setCount((current) => (current >= total ? current : current + 1))
    }, step)
    return () => window.clearInterval(timer)
  }, [leaving, mode, total])

  function finish() {
    if (doneRef.current) return
    doneRef.current = true
    setLeaving(true)
    window.setTimeout(() => onDoneRef.current?.(), 420)
  }

  useEffect(() => {
    if (leaving || count < total) return undefined
    const hold = mode === "auth" ? 180 : 460
    const timer = window.setTimeout(finish, hold)
    return () => window.clearTimeout(timer)
  }, [count, leaving, mode, total])

  let consumed = 0
  let cursorLine = lines.length - 1
  for (let index = 0; index < lengths.length; index += 1) {
    if (count < consumed + lengths[index]) {
      cursorLine = index
      break
    }
    consumed += lengths[index]
  }

  let remaining = count

  return (
    <div className={`boot-sequence ${mode === "auth" ? "is-auth" : ""} ${leaving ? "is-leaving" : ""}`} role="dialog" aria-label={mode === "auth" ? "權限核對" : "系統開機"}>
      <div className="boot-sequence-scan" />
      <div className="relative z-10 w-full max-w-3xl px-6 font-mono text-sm leading-8 sm:px-10 sm:text-[15px]">
        {lines.map((tokens, lineIndex) => {
          const visible = Math.max(0, Math.min(lengths[lineIndex], remaining))
          remaining -= lengths[lineIndex]
          if (visible <= 0) return <p key={lineIndex} className="min-h-8" />
          return (
            <p key={lineIndex} className="min-h-8 break-all text-[#d5d1c8]">
              <LineTokens tokens={tokens} visible={visible} />
              {!leaving && lineIndex === cursorLine && <span className="terminal-cursor">_</span>}
            </p>
          )
        })}
      </div>
      {mode === "boot" && (
        <button type="button" onClick={finish} className="absolute right-5 bottom-5 z-10 font-mono text-[11px] tracking-wide text-[#8d8983] hover:text-white sm:right-8 sm:bottom-8">
          [ SKIP // 略過自檢 ]
        </button>
      )}
    </div>
  )
}

function LineTokens({ tokens, visible }) {
  let left = visible
  return tokens.map((token, index) => {
    if (left <= 0) return null
    if (token.type === "bar") {
      const filled = Math.min(10, left)
      left -= 10
      return <ProgressBar key={index} filled={filled} />
    }
    const text = token.text.slice(0, left)
    left -= text.length
    if (!text) return null
    if (token.tone === "redact") return <span key={index} className="redacted">{text}</span>
    return <span key={index} className={toneClass(token.tone)}>{text}</span>
  })
}

function ProgressBar({ filled }) {
  const cells = Array.from({ length: 10 }, (_, index) => (index < filled ? "█" : "░")).join("")
  return <span className="text-[#8d8983]">[{cells}]</span>
}

function toneClass(tone) {
  if (tone === "ok") return "text-[#10b981]"
  if (tone === "council") return "text-[#f4f7fb]"
  if (tone === "restricted") return "text-[#dc2626]"
  if (tone === "guest") return "text-[#c4c0ba]"
  if (tone === "subject") return "text-white"
  return ""
}
