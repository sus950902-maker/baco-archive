import { useEffect, useState } from "react"
import { collection, onSnapshot, query, where } from "firebase/firestore"
import { characterTitle, claimCharacter, FACTION_COLOR, publicCharacter } from "../characters"
import { db } from "../firebase"

const FILTERS = ["全部", "我的檔案", "調查員", "異常", "民眾", "議會"]

function fileNoValue(record) {
  const value = Number(record.fileNo)
  return Number.isInteger(value) && value > 0 ? value : Number.POSITIVE_INFINITY
}

function byFileNo(left, right) {
  const leftNo = fileNoValue(left)
  const rightNo = fileNoValue(right)
  const leftNumbered = leftNo !== Number.POSITIVE_INFINITY
  const rightNumbered = rightNo !== Number.POSITIVE_INFINITY
  if (leftNumbered || rightNumbered) {
    if (!leftNumbered) return 1
    if (!rightNumbered) return -1
    if (leftNo !== rightNo) return leftNo - rightNo
  }
  return (left.fileNo || left.uid || "").localeCompare(right.fileNo || right.uid || "", "zh")
}

function shuffle(list) {
  const next = [...list]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    const current = next[index]
    next[index] = next[swap]
    next[swap] = current
  }
  return next
}

export default function PersonnelRoster({ user, profile, onNotice, onOpen, onEdit }) {
  const [records, setRecords] = useState([])
  const [filter, setFilter] = useState("全部")
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [loadError, setLoadError] = useState("")
  const [entrance, setEntrance] = useState(0)
  const [allOrder, setAllOrder] = useState([])

  useEffect(() => {
    const roster = query(collection(db, "characters"), where("status", "==", "bound"))
    return onSnapshot(
      roster,
      (snap) => {
        setLoadError("")
        setRecords(snap.docs.map((entry) => publicCharacter(entry.id, entry.data())))
      },
      () => setLoadError("公開名冊讀取失敗"),
    )
  }, [])

  useEffect(() => {
    setAllOrder((current) => {
      const ids = records.map((record) => record.id)
      const kept = current.filter((id) => ids.includes(id))
      const added = ids.filter((id) => !current.includes(id))
      if (!added.length && kept.length === current.length) return current
      if (!kept.length) return shuffle(ids)
      return [...kept, ...shuffle(added)]
    })
  }, [records])

  const visible = records.filter((record) => {
    if (filter === "我的檔案") return Boolean(user) && record.ownerUid === user.uid
    return filter === "全部" || record.faction === filter
  })
  const ordered =
    filter === "全部"
      ? [...visible].sort((left, right) => allOrder.indexOf(left.id) - allOrder.indexOf(right.id))
      : [...visible].sort(byFileNo)

  async function claim(event) {
    event.preventDefault()
    if (!user) {
      onNotice({ code: "BINDING // DENIED", message: "請先接入終端後再設定檔案。" })
      return
    }
    setBusy(true)
    setError("")
    try {
      const record = await claimCharacter(code, user, profile)
      setCode("")
      onNotice({ code: "BINDING // CONFIRMED", message: "身份綁定成功！已取得該角色卡編輯與使用權限" })
      onEdit(record)
    } catch (bindError) {
      const denied = bindError.code === "permission-denied"
      const message = denied ? "該檔案已被其他帳號綁定" : bindError.message || "綁定碼無效，檔案不存在"
      setError(message)
      onNotice({ code: "BINDING // DENIED", message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="reveal-right mb-5">
        <p className="font-mono text-[11px] tracking-[0.22em] text-comment">PERSONNEL ROSTER // 公開名冊</p>
        <h2 className="mt-2 text-2xl font-medium sm:text-3xl">人員配置</h2>
      </div>

      <form onSubmit={claim} className="panel hud-corner p-5 sm:p-6">
        <p className="font-mono text-[11px] tracking-[0.18em] text-ash">輸入角色綁定碼（BINDING CODE）設定檔案</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            value={code}
            disabled={busy}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="A7X9-K2M4"
            aria-label="角色綁定碼"
            className="w-full border border-black/20 bg-white px-3 py-2 font-mono text-sm tracking-[0.18em] text-black outline-none focus:border-alert"
          />
          <button
            type="submit"
            disabled={busy || !code.trim()}
            className="shrink-0 border border-black px-3 py-2 font-mono text-xs tracking-wide text-ink hover:border-alert hover:text-alert disabled:opacity-40"
          >
            [ 執行權限綁定 ]
          </button>
        </div>
        {!user && <p className="mt-3 font-mono text-[11px] text-ash">設定檔案前需先完成 GOOGLE 驗證。</p>}
        {error && <p className="mt-3 font-mono text-[11px] text-alert">{error}</p>}
      </form>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setFilter(item)
              setEntrance((current) => current + 1)
              if (item === "全部") setAllOrder(shuffle(records.map((record) => record.id)))
            }}
            className={`border px-3 py-1.5 font-mono text-xs tracking-wide ${filter === item ? "border-black bg-black text-white" : "border-black/20 bg-white text-ink"}`}
          >
            {item}
          </button>
        ))}
      </div>

      {loadError ? (
        <p className="mt-8 font-mono text-xs tracking-wide text-alert">{loadError}</p>
      ) : ordered.length === 0 ? (
        <p className="mt-8 font-mono text-xs tracking-wide text-ash">
          {filter === "我的檔案" ? (user ? "尚無你的檔案" : "請先接入終端後再查看我的檔案。") : "尚無已綁定人員"}
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((record, index) => (
            <li key={`${entrance}-${record.id}`} className="roster-card" style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}>
              <button type="button" onClick={() => onOpen(record)} className="panel hud-corner flex w-full items-start gap-4 p-4 text-left hover:border-black">
                {record.avatarUrl ? (
                  <img src={record.avatarUrl} alt="" className="aspect-[7/9] w-16 shrink-0 object-cover" />
                ) : (
                  <span className="flex aspect-[7/9] w-16 shrink-0 items-center justify-center bg-black font-mono text-xs text-white">
                    {(record.name || "?").slice(0, 1)}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate text-base font-medium">{characterTitle(record)}</span>
                  <span className="mt-1 block font-mono text-[11px] tracking-wide" style={{ color: FACTION_COLOR[record.faction] || "#5c5854" }}>
                    {record.faction}
                  </span>
                  <span className="mt-1 block truncate font-mono text-[11px] text-ash">{record.department}</span>
                  <span className="mt-2 block font-mono text-[10px] tracking-[0.14em] text-ash">UID // {record.uid}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
