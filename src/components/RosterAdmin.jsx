import { useEffect, useRef, useState } from "react"
import { collection, doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore"
import { assignFileNumbers, FACTION_COLOR, FACTIONS, issueBindCode, publicCharacter, removeCharacter } from "../characters"
import { db } from "../firebase"
import { deleteStoredImage, publicIdFromUrl } from "../media"

export default function RosterAdmin({ staff, role, ready, onNotice }) {
  const [records, setRecords] = useState([])
  const [accounts, setAccounts] = useState([])
  const [faction, setFaction] = useState(FACTIONS[0])
  const [order, setOrder] = useState("正序")
  const [pendingRevoke, setPendingRevoke] = useState("")
  const lowSynced = useRef(new Set())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [pendingDelete, setPendingDelete] = useState("")
  const [councilCode, setCouncilCode] = useState("")

  useEffect(() => {
    if (!ready || staff) return undefined
    onNotice({ code: "CLEARANCE // DENIED", message: "權限不足。本區僅限中級以上管理權限調閱。" })
    return undefined
  }, [ready, staff, onNotice])

  useEffect(() => {
    if (!staff) return undefined
    assignFileNumbers("調查員").catch(() => {})
    assignFileNumbers("異常").catch(() => {})
    return undefined
  }, [staff])

  useEffect(() => {
    if (!staff) return undefined
    return onSnapshot(
      collection(db, "characters"),
      (snap) => {
        const next = snap.docs.map((entry) => ({
          ...publicCharacter(entry.id, entry.data()),
          bindCode: entry.data().bindCode || "",
        }))
        setRecords(next)
        setError("")
      },
      () => setError("綁定碼清單讀取失敗"),
    )
  }, [staff])

  useEffect(() => {
    if (!staff) return undefined
    return onSnapshot(collection(db, "users"), (snap) => {
      setAccounts(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() })))
    })
  }, [staff])

  useEffect(() => {
    if (!staff) return undefined
    const owners = new Set(records.filter((record) => record.status === "bound" && record.ownerUid).map((record) => record.ownerUid))
    accounts.forEach((account) => {
      if ((account.role && account.role !== "user") || !owners.has(account.id) || lowSynced.current.has(account.id)) return
      lowSynced.current.add(account.id)
      updateDoc(doc(db, "users", account.id), { role: "low", updatedAt: serverTimestamp() }).catch(() => {
        lowSynced.current.delete(account.id)
      })
    })
    return undefined
  }, [staff, accounts, records])

  async function generate() {
    setBusy(true)
    setError("")
    try {
      const created = await issueBindCode(faction, councilCode)
      if (faction === "議會") setCouncilCode("")
      onNotice({
        code: "ROSTER // ISSUED",
        message: faction === "議會" ? `綁定碼 ${created.bindCode} 已生成 // 議會 ${created.fileNo}` : `綁定碼 ${created.bindCode} 已生成 // ${faction} ${created.fileNo}`,
      })
    } catch (createError) {
      setError(createError.message || "綁定碼生成失敗")
    } finally {
      setBusy(false)
    }
  }

  async function revokeMid(account) {
    const ownsCard = records.some((record) => record.status === "bound" && record.ownerUid === account.id)
    try {
      await updateDoc(doc(db, "users", account.id), {
        role: ownsCard ? "low" : "user",
        clearanceHold: true,
        updatedAt: serverTimestamp(),
      })
      setPendingRevoke("")
      onNotice({ code: "CLEARANCE // REVOKED", message: `${account.displayName || account.publicUid || "帳號"} 的中級管理權已移除。` })
    } catch (revokeError) {
      onNotice({ code: "CLEARANCE // DENIED", message: revokeError.message || "管理權移除失敗" })
    }
  }

  async function copyCode(code) {
    try {
      await navigator.clipboard.writeText(code)
      onNotice({ code: "ROSTER // COPIED", message: `綁定碼 ${code} 已複製。` })
    } catch {
      onNotice({ code: "ROSTER // DENIED", message: "無法寫入剪貼簿。" })
    }
  }

  async function destroy(record) {
    try {
      const avatarId = record.avatarPublicId || publicIdFromUrl(record.avatarUrl)
      if (record.avatarUrl?.includes("res.cloudinary.com") && !avatarId) throw new Error("找不到頭像的圖片庫編號")
      await deleteStoredImage(avatarId)
      await deleteStoredImage(record.portraitPublicId || publicIdFromUrl(record.portraitUrl))
      await deleteStoredImage(record.idCardPublicId || publicIdFromUrl(record.idCardUrl))
      await removeCharacter(record)
      setPendingDelete("")
      onNotice({ code: "ROSTER // DELETED", message: `${record.bindCode} 與角色檔案已刪除。頭像已從圖片庫移除。` })
    } catch (deleteError) {
      onNotice({ code: "ROSTER // DENIED", message: deleteError.message || "刪除失敗" })
    }
  }

  if (!ready) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="text-2xl font-medium sm:text-3xl">人員管理</h2>
        <p className="mt-4 font-mono text-xs tracking-wide text-ash">權限核對中</p>
      </section>
    )
  }

  if (!staff) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="reveal-right mb-5">
          <p className="font-mono text-[11px] tracking-[0.22em] text-comment">ROSTER ADMIN // RESTRICTED</p>
          <h2 className="mt-2 text-2xl font-medium sm:text-3xl">人員管理</h2>
        </div>
        <div className="panel hud-corner p-5 sm:p-8">
          <p className="font-mono text-sm tracking-wide">權限不足。本區僅限中級以上管理權限調閱。</p>
        </div>
      </section>
    )
  }

  const owners = new Set(records.filter((record) => record.status === "bound" && record.ownerUid).map((record) => record.ownerUid))
  const midAccounts = accounts.filter((account) => account.role === "moderator")
  const lowAccounts = accounts.filter((account) => account.role !== "admin" && account.role !== "moderator" && (account.role === "low" || owners.has(account.id)))
  const counts = Object.fromEntries(FACTIONS.map((item) => [item, records.filter((record) => record.faction === item).length]))
  const visible = records.filter((record) => record.faction === faction).sort((left, right) => {
    const leftNo = Number(left.fileNo)
    const rightNo = Number(right.fileNo)
    const leftNumbered = Number.isInteger(leftNo) && leftNo > 0
    const rightNumbered = Number.isInteger(rightNo) && rightNo > 0
    let result = 0
    if (leftNumbered || rightNumbered) {
      if (!leftNumbered) result = 1
      else if (!rightNumbered) result = -1
      else if (leftNo !== rightNo) result = leftNo - rightNo
    }
    if (!result) result = (left.createdAt || 0) - (right.createdAt || 0) || (left.id || "").localeCompare(right.id || "")
    return order === "倒序" ? -result : result
  })

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="reveal-right mb-5">
        <p className="font-mono text-[11px] tracking-[0.22em] text-comment">ROSTER ADMIN // BINDING CODES</p>
        <h2 className="mt-2 text-2xl font-medium sm:text-3xl">人員管理</h2>
      </div>
      <div className="panel hud-corner relative p-5 sm:p-6">
        <aside className="mb-4 flex flex-col items-end gap-3 sm:absolute sm:top-6 sm:right-6 sm:mb-0">
          <button
            type="button"
            aria-label={order === "正序" ? "正序，點擊改為倒序" : "倒序，點擊改為正序"}
            onClick={() => setOrder((current) => (current === "正序" ? "倒序" : "正序"))}
            className="border border-black/20 bg-white p-1.5 text-ink hover:border-black"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="block">
              <path d="M4.5 13V5.2L2.6 7.1 1.7 6.2 4.5 3.4 7.3 6.2 6.4 7.1 4.5 5.2V13Z" className={order === "正序" ? "fill-black" : "fill-black/25"} />
              <path d="M11.5 3v7.8l1.9-1.9.9.9-2.8 2.8-2.8-2.8.9-.9 1.9 1.9V3Z" className={order === "倒序" ? "fill-black" : "fill-black/25"} />
            </svg>
          </button>
          <p className="flex flex-col items-end gap-1 font-mono text-[11px] tracking-[0.14em]">
            <span className="text-ink">全部 {records.length}</span>
            {FACTIONS.map((item) => (
              <span key={item} style={{ color: FACTION_COLOR[item] || "#5c5854" }}>
                {item} {counts[item]}
              </span>
            ))}
          </p>
        </aside>
        <div className="sm:min-h-40 sm:pr-28">
        <p className="font-mono text-[11px] tracking-[0.16em] text-ash">生成時先指定陣營，一碼只對應一張角色卡</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {FACTIONS.map((item) => (
            <button
              key={item}
              type="button"
              disabled={busy}
              onClick={() => setFaction(item)}
              className={`border px-3 py-1.5 font-mono text-xs tracking-wide ${faction === item ? "border-black bg-black text-white" : "border-black/20 bg-white text-ink"}`}
            >
              {item}
            </button>
          ))}
        </div>
        {faction === "議會" && (
          <label className="mt-4 block font-mono text-[11px] tracking-[0.16em] text-ash">
            特殊代號
            <input
              value={councilCode}
              disabled={busy}
              maxLength={16}
              onChange={(event) => setCouncilCode(event.target.value)}
              className="mt-2 w-full border border-black/20 bg-white px-3 py-2 font-mono text-sm tracking-[0.12em] text-black outline-none focus:border-alert"
            />
          </label>
        )}
        <button
          type="button"
          disabled={busy || (faction === "議會" && !councilCode.trim())}
          onClick={generate}
          className="mt-4 border border-black px-3 py-2 font-mono text-xs tracking-wide text-ink hover:border-alert hover:text-alert disabled:opacity-40"
        >
          [ 生成綁定碼 ]
        </button>
        {error && <p className="mt-4 font-mono text-[11px] text-alert">{error}</p>}
        </div>
        {visible.length === 0 ? (
          <p className="mt-6 font-mono text-xs text-ash">尚無綁定碼</p>
        ) : (
          <ul className="mt-4 divide-y divide-black/10 overflow-x-auto">
            {visible.map((record) => (
              <li key={record.id} className="grid min-w-[44rem] grid-cols-[9rem_5rem_3.5rem_4.5rem_minmax(8rem,1fr)_auto] items-center gap-x-4 py-3">
                <span className="font-mono text-sm tracking-[0.16em]">{record.bindCode || "——"}</span>
                <span className="font-mono text-[11px] tracking-[0.14em]" style={{ color: FACTION_COLOR[record.faction] || "#5c5854" }}>
                  {record.faction}
                </span>
                <span className="font-mono text-[11px] tracking-[0.14em] text-ash">{record.fileNo || ""}</span>
                <span className={`font-mono text-[11px] tracking-[0.14em] ${record.status === "bound" ? "text-signal" : "text-ash"}`}>
                  {record.status === "bound" ? "已綁定" : "未綁定"}
                </span>
                <span className="truncate text-sm text-ash">{record.name && record.name !== "未命名" ? record.name : ""}</span>
                <span className="flex gap-2">
                  {record.bindCode && (
                    <button type="button" onClick={() => copyCode(record.bindCode)} className="border border-black/20 px-2 py-1.5 font-mono text-[11px] text-ink hover:border-alert hover:text-alert">
                      [ 複製 ]
                    </button>
                  )}
                  {pendingDelete === record.id ? (
                    <button type="button" onClick={() => destroy(record)} className="border border-alert px-2 py-1.5 font-mono text-[11px] text-alert">
                      [ 確認刪除 ]
                    </button>
                  ) : (
                    <button type="button" onClick={() => setPendingDelete(record.id)} className="border border-black/20 px-2 py-1.5 font-mono text-[11px] text-ash hover:text-alert">
                      [ 刪除 ]
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="panel hud-corner mt-10 p-5 sm:p-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-comment">CLEARANCE // ACCOUNTS</p>
        <h3 className="mt-2 text-xl font-medium">權限帳號</h3>
        <p className="mt-6 font-mono text-[11px] tracking-[0.16em] text-ash">中級管理</p>
        {midAccounts.length === 0 ? (
          <p className="mt-3 font-mono text-xs text-ash">尚無中級管理帳號</p>
        ) : (
          <ul className="mt-3 divide-y divide-black/10">
            {midAccounts.map((account) => (
              <li key={account.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm">{account.displayName || "未命名"}</span>
                  <span className="mt-1 block font-mono text-[11px] tracking-[0.14em] text-ash">{account.publicUid || account.email || account.id}</span>
                </span>
                {role === "admin" && (
                  pendingRevoke === account.id ? (
                    <button type="button" onClick={() => revokeMid(account)} className="border border-alert px-2 py-1.5 font-mono text-[11px] text-alert">
                      [ 確認移除 ]
                    </button>
                  ) : (
                    <button type="button" onClick={() => setPendingRevoke(account.id)} className="border border-black/20 px-2 py-1.5 font-mono text-[11px] text-ash hover:text-alert">
                      [ 移除管理權 ]
                    </button>
                  )
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-8 font-mono text-[11px] tracking-[0.16em] text-ash">低級權限</p>
        <p className="mt-2 font-mono text-[11px] text-ash">擁有角色卡的帳號自動具有低級權限。</p>
        {lowAccounts.length === 0 ? (
          <p className="mt-3 font-mono text-xs text-ash">尚無低級權限帳號</p>
        ) : (
          <ul className="mt-3 divide-y divide-black/10">
            {lowAccounts.map((account) => (
              <li key={account.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm">{account.displayName || "未命名"}</span>
                  <span className="mt-1 block font-mono text-[11px] tracking-[0.14em] text-ash">{account.publicUid || account.email || account.id}</span>
                </span>
                <span className="font-mono text-[11px] tracking-[0.14em] text-ash">低級</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
