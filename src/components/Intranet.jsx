import { useCallback, useEffect, useRef, useState } from "react"
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore"
import { readAnnouncement } from "../characters"
import { db } from "../firebase"
import AnnouncementLine from "./AnnouncementLine"
import WorldMap from "./WorldMap"

const SEEN_KEY = "baco-announcement-seen"
const POP_MS = 3000

function formatStamp(millis) {
  if (!millis) return ""
  const date = new Date(millis)
  const pad = (value) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function AnnouncementTicker() {
  const [popup, setPopup] = useState(null)
  const seen = useRef(sessionStorage.getItem(SEEN_KEY) || "")
  const ready = useRef(false)
  const known = useRef(new Set())

  function show(item) {
    seen.current = item.id
    sessionStorage.setItem(SEEN_KEY, item.id)
    setPopup(item)
  }

  useEffect(() => {
    const latest = query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(1))
    return onSnapshot(latest, (snap) => {
      const next = snap.docs
        .map((entry) => readAnnouncement(entry.id, entry.data()))
        .sort((left, right) => right.createdAt - left.createdAt || right.id.localeCompare(left.id))
      if (!ready.current) {
        ready.current = true
        next.forEach((item) => known.current.add(item.id))
        if (next[0] && next[0].id !== seen.current) show(next[0])
        return
      }
      const added = next.filter((item) => !known.current.has(item.id))
      next.forEach((item) => known.current.add(item.id))
      if (added[0]) show(added[0])
    })
  }, [])

  const dismissPopup = useCallback(() => setPopup(null), [])

  return popup ? <AnnouncementPop key={popup.id} item={popup} onDone={dismissPopup} /> : null
}

export default function Intranet() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <AnnouncementTicker />
      <WorldMap />
    </section>
  )
}

function AnnouncementPop({ item, onDone }) {
  const barRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setOpen(true))
    const hold = window.setTimeout(() => setLeaving(true), POP_MS)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(hold)
    }
  }, [])

  useEffect(() => {
    if (!leaving) return undefined
    const bar = barRef.current
    if (!bar) return undefined
    const width = bar.offsetWidth
    bar.style.transition = "none"
    bar.style.width = `${width}px`
    bar.getBoundingClientRect()
    bar.style.transition = "width 0.4s ease, padding 0.4s ease, border-width 0.4s ease"
    bar.style.width = "0px"
    bar.style.paddingLeft = "0px"
    bar.style.paddingRight = "0px"
    bar.style.borderWidth = "0px"
    const done = window.setTimeout(onDone, 420)
    return () => window.clearTimeout(done)
  }, [leaving, onDone])

  return (
    <div className={`announcement-reveal ${open ? "is-open" : ""}`} style={{ top: "calc(var(--header-h, 6.5rem) + 1.25rem)" }}>
      <div className="announcement-reveal-clip">
        <div ref={barRef} className="announcement-bar">
          <span className="shrink-0 text-xs leading-5 tracking-wide text-white">[  機構公告  ]</span>
          <AnnouncementLine item={item} className="text-xs leading-5 whitespace-nowrap" />
          <span className="shrink-0 font-mono text-[10px] tracking-[0.12em] text-white">{formatStamp(item.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}
