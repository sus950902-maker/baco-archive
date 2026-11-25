import { useEffect, useState } from "react"
import { peekBoundRoster, subscribeBoundRoster } from "../boundRoster"
import { primeTouch } from "../primeTouch"
import { characterTitle, claimCharacter, FACTION_COLOR, factionHasDepartment, factionLabel } from "../characters"
import PortraitArt from "./PortraitArt"

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
  return (left.createdAt || 0) - (right.createdAt || 0) || (left.id || "").localeCompare(right.id || "")
}

const MINE_ORDER = ["議會", "調查員", "民眾", "異常"]

function byMine(left, right) {
  const leftRank = MINE_ORDER.indexOf(left.faction)
  const rightRank = MINE_ORDER.indexOf(right.faction)
  const leftIndex = leftRank === -1 ? MINE_ORDER.length : leftRank
  const rightIndex = rightRank === -1 ? MINE_ORDER.length : rightRank
  if (leftIndex !== rightIndex) return leftIndex - rightIndex
  return byFileNo(left, right)
}

export default function PersonnelRoster({ user, profile, onNotice, onOpen, onEdit, initialFilter = "全部" }) {
  const cached = peekBoundRoster()
  const [records, setRecords] = useState(cached.records)
  const [filter, setFilter] = useState(initialFilter)
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [loadError, setLoadError] = useState(cached.error)
  const [entrance, setEntrance] = useState(0)
  const [search, setSearch] = useState("")

  useEffect(() => subscribeBoundRoster((snapshot) => {
    setRecords(snapshot.records)
    setLoadError(snapshot.error)
  }), [])

  const needle = search.trim().toLowerCase()
  const visible = records.filter((record) => {
    const inFaction = filter === "我的檔案" ? Boolean(user) && record.ownerUid === user.uid : filter === "全部" || record.faction === filter
    if (!inFaction) return false
    if (!needle) return true
    return (record.name || "").toLowerCase().includes(needle) || (record.fileNo || "").toLowerCase().includes(needle)
  })
  const ordered = [...visible].sort(filter === "全部" || filter === "我的檔案" ? byMine : byFileNo)

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
    <section className="roster-section mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-16 sm:px-6 sm:py-24">
      <div className="reveal-right mb-5">
        <p className="font-mono text-[11px] tracking-[0.22em] text-comment">PERSONNEL ROSTER // 內部名冊</p>
        <h2 className="mt-2 text-2xl font-medium sm:text-3xl">檔案庫</h2>
      </div>

      <form onSubmit={claim} className="panel hud-corner p-5 sm:p-6">
        <p className="font-mono text-[11px] tracking-[0.18em] text-ash">輸入綁定碼（BINDING CODE）設定檔案</p>
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

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex gap-1 sm:contents sm:gap-2">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setFilter(item)
                setEntrance((current) => current + 1)
              }}
              className={`min-w-0 flex-1 whitespace-nowrap border px-1 py-1.5 text-center font-mono text-[clamp(0.58rem,2.45vw,0.75rem)] tracking-wide sm:flex-none sm:px-3 sm:text-xs ${filter === item ? "border-black bg-black text-white" : "border-black/20 bg-white text-ink"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="搜索名稱或編號"
          aria-label="搜索名稱或編號"
          className="w-full min-w-0 border border-black/20 bg-white px-3 py-1.5 font-mono text-xs text-black outline-none focus:border-alert sm:ml-auto sm:w-52"
        />
      </div>

      <div className="roster-dark mt-16 flex-1">
      {loadError ? (
        <p className="font-mono text-xs tracking-wide text-alert">{loadError}</p>
      ) : ordered.length === 0 ? (
        <p className="font-mono text-xs tracking-wide text-ash">
          {needle ? "沒有符合的檔案" : filter === "我的檔案" ? (user ? "尚無你的檔案" : "請先接入終端後再查看我的檔案。") : "尚無已綁定人員"}
        </p>
      ) : (
        <ul className="roster-grid grid min-w-0 gap-x-4 gap-y-10 pt-10 pr-3 pb-3 pl-3 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((record, index) => (
            <li key={`${entrance}-${record.id}`} className="roster-card" style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}>
              <div className="character-shadow">
              <button type="button" onClick={(event) => { if (primeTouch(event)) return; onOpen(record) }} className={`panel character-card character-sheet relative w-full min-w-0 max-w-full origin-center overflow-visible p-0 text-left transition-transform duration-200 ease-out hover:scale-[1.025] ${record.portraitUrl ? "min-h-[var(--portrait-h)] pr-[var(--portrait-w)]" : ""}`}>
                <span className="character-logo-clip" aria-hidden="true">
                  <img src="/logo4.png" alt="" className="character-logo" />
                </span>
                <span data-card-copy className="relative z-[4] flex w-full min-w-0 items-end gap-4 p-4 max-sm:gap-[clamp(0.5rem,3cqw,1rem)] max-sm:p-[clamp(0.6rem,3.5cqw,1rem)]">
                  {record.avatarUrl ? (
                    <img src={record.avatarUrl} alt="" className="aspect-[7/9] w-16 shrink-0 object-cover max-sm:w-[clamp(2.25rem,20cqw,4rem)]" />
                  ) : (
                    <span className="flex aspect-[7/9] w-16 shrink-0 items-center justify-center bg-black font-mono text-xs text-white max-sm:w-[clamp(2.25rem,20cqw,4rem)]">
                      {(record.name || "?").slice(0, 1)}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-base font-medium">{characterTitle(record)}</span>
                    <span className="mt-1 block truncate font-mono text-[11px] tracking-wide" style={{ color: FACTION_COLOR[record.faction] || "#5c5854" }}>
                      {factionLabel(record)}
                    </span>
                    <span className={`mt-1 block truncate font-mono text-[11px] text-ash ${factionHasDepartment(record.faction) ? "" : "invisible"}`} aria-hidden={factionHasDepartment(record.faction) ? undefined : true}>
                      {factionHasDepartment(record.faction) ? record.department : "無 / 民間"}
                    </span>
                    <span className="mt-2 block truncate font-mono text-[10px] tracking-[0.14em] text-ash">UID：{record.uid}</span>
                  </span>
                </span>
                <PortraitArt
                  url={record.portraitUrl}
                  ratio={{ x: record.portraitX, y: record.portraitY }}
                  scale={record.portraitScale}
                  frameClass=""
                />
                <span className="character-foot" aria-hidden="true" />
              </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      </div>
    </section>
  )
}
