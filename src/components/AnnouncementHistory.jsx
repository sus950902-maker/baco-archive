import { useEffect, useRef, useState } from "react"
import { collection, deleteDoc, doc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, startAfter } from "firebase/firestore"
import { readAnnouncement } from "../characters"
import { auth, db } from "../firebase"
import AnnouncementLine from "./AnnouncementLine"
import { AnnouncementTicker } from "./Intranet"

function formatStamp(millis) {
  if (!millis) return ""
  const date = new Date(millis)
  const pad = (value) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const PAGE = 5

function rowsFrom(docs) {
  return docs.filter((entry) => !entry.data().ephemeral).map((entry) => readAnnouncement(entry.id, entry.data()))
}

export default function AnnouncementHistory({ staff, onNotice }) {
  const [latest, setLatest] = useState([])
  const [older, setOlder] = useState([])
  const [hasMore, setHasMore] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [pendingDelete, setPendingDelete] = useState("")
  const cursor = useRef(null)
  const seeded = useRef(false)

  useEffect(() => {
    const recent = query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(PAGE))
    return onSnapshot(recent, (snap) => {
      setLatest(rowsFrom(snap.docs))
      if (!seeded.current) {
        cursor.current = snap.docs[snap.docs.length - 1] || null
        seeded.current = true
        setHasMore(snap.docs.length === PAGE)
      }
    })
  }, [])

  async function loadOlder() {
    if (!cursor.current || loadingOlder) return
    setLoadingOlder(true)
    try {
      const snap = await getDocs(query(collection(db, "announcements"), orderBy("createdAt", "desc"), startAfter(cursor.current), limit(PAGE)))
      const next = rowsFrom(snap.docs)
      setOlder((current) => {
        const seen = new Set(current.map((item) => item.id))
        return [...current, ...next.filter((item) => !seen.has(item.id))]
      })
      cursor.current = snap.docs[snap.docs.length - 1] || null
      setHasMore(snap.docs.length === PAGE)
    } catch (error) {
      onNotice?.({ code: "ANNOUNCE // DENIED", message: error.message || "公告讀取失敗" })
    } finally {
      setLoadingOlder(false)
    }
  }

  const items = [...latest, ...older.filter((item) => !latest.some((row) => row.id === item.id))]

  async function publishTest() {
    try {
      const user = auth.currentUser
      if (!user) throw new Error("請先登入")
      await setDoc(doc(db, "announcements", `probe-${user.uid}`), {
        text: "測試123456789",
        ephemeral: true,
        createdAt: serverTimestamp(),
      })
    } catch (error) {
      const limited = error.code === "permission-denied"
      onNotice?.({ code: "ANNOUNCE // DENIED", message: limited ? "測試公告需間隔 20 秒" : error.message || "測試公告發布失敗" })
    }
  }

  async function remove(item) {
    try {
      await deleteDoc(doc(db, "announcements", item.id))
      setPendingDelete("")
    } catch (error) {
      onNotice?.({ code: "ANNOUNCE // DENIED", message: error.message || "公告刪除失敗" })
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 text-white sm:px-6 sm:py-24">
      <AnnouncementTicker />
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-[0.22em] text-white">INTERNAL DOMAIN // BULLETIN</p>
          <h2 className="mt-2 text-2xl font-medium text-white sm:text-3xl">歷史公告</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {staff && (
            <button type="button" onClick={publishTest} className="border border-white/20 px-3 py-2 font-mono text-xs tracking-wide text-white hover:border-white">
              [ 發布測試 ]
            </button>
          )}
          <a href="#intranet" className="border border-white/20 px-3 py-2 font-mono text-xs tracking-wide text-white hover:border-white">
            [ 返回內部網域 ]
          </a>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="font-mono text-xs tracking-wide text-white">尚無公告</p>
      ) : (
        <ul className="divide-y divide-white/10 border-y border-white/10">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-4">
              <AnnouncementLine item={item} className="min-w-0 flex-1 text-sm leading-6 text-white sm:text-base" />
              {staff && (
                pendingDelete === item.id ? (
                  <button type="button" onClick={() => remove(item)} className="shrink-0 font-mono text-[11px] text-alert">
                    [ 確認刪除 ]
                  </button>
                ) : (
                  <button type="button" onClick={() => setPendingDelete(item.id)} className="shrink-0 font-mono text-[11px] text-white hover:text-alert">
                    [ 刪除 ]
                  </button>
                )
              )}
              <p className="shrink-0 font-mono text-[10px] tracking-[0.14em] text-white">{formatStamp(item.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
      {hasMore && (
        <button type="button" disabled={loadingOlder} onClick={loadOlder} className="mx-auto mt-6 block border border-white/20 px-3 py-2 font-mono text-xs tracking-wide text-white hover:border-white disabled:opacity-40">
          {loadingOlder ? "[ 讀取中 ]" : "[ 載入更多 ]"}
        </button>
      )}
    </section>
  )
}
