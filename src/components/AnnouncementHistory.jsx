import { useEffect, useState } from "react"
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp } from "firebase/firestore"
import { readAnnouncement } from "../characters"
import { db } from "../firebase"
import AnnouncementLine from "./AnnouncementLine"

function formatStamp(millis) {
  if (!millis) return ""
  const date = new Date(millis)
  const pad = (value) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export default function AnnouncementHistory({ staff, onNotice }) {
  const [items, setItems] = useState([])
  const [pendingDelete, setPendingDelete] = useState("")

  useEffect(() => {
    return onSnapshot(collection(db, "announcements"), (snap) => {
      const next = snap.docs
        .filter((entry) => !entry.data().ephemeral)
        .map((entry) => readAnnouncement(entry.id, entry.data()))
        .sort((left, right) => right.createdAt - left.createdAt || right.id.localeCompare(left.id))
      setItems(next)
    })
  }, [])

  async function publishTest() {
    try {
      const created = await addDoc(collection(db, "announcements"), {
        text: "測試123456789",
        ephemeral: true,
        createdAt: serverTimestamp(),
      })
      window.setTimeout(() => {
        deleteDoc(created).catch(() => {})
      }, 4000)
    } catch (error) {
      onNotice?.({ code: "ANNOUNCE // DENIED", message: error.message || "測試公告發布失敗" })
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
    </section>
  )
}
