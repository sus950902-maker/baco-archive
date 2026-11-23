import { useEffect, useState } from "react"
import { collection, onSnapshot } from "firebase/firestore"
import { assignFileNumbers, characterTitle, FACTION_COLOR, FACTIONS, issueBindCode, publicCharacter, removeCharacter } from "../characters"
import { db } from "../firebase"
import { deleteStoredImage, publicIdFromUrl } from "../media"

export default function RosterAdmin({ staff, ready, onNotice }) {
  const [records, setRecords] = useState([])
  const [faction, setFaction] = useState(FACTIONS[0])
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
        next.sort((a, b) => Number(a.status === "bound") - Number(b.status === "bound"))
        setRecords(next)
        setError("")
      },
      () => setError("綁定碼清單讀取失敗"),
    )
  }, [staff])

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
      await removeCharacter(record)
      deleteStoredImage(record.avatarPublicId || publicIdFromUrl(record.avatarUrl))
      deleteStoredImage(record.portraitPublicId || publicIdFromUrl(record.portraitUrl))
      deleteStoredImage(record.idCardPublicId || publicIdFromUrl(record.idCardUrl))
      setPendingDelete("")
      onNotice({ code: "ROSTER // DELETED", message: `${record.bindCode} 與角色檔案已刪除。` })
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

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="reveal-right mb-5">
        <p className="font-mono text-[11px] tracking-[0.22em] text-comment">ROSTER ADMIN // BINDING CODES</p>
        <h2 className="mt-2 text-2xl font-medium sm:text-3xl">人員管理</h2>
      </div>
      <div className="panel hud-corner p-5 sm:p-6">
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
        {records.length === 0 ? (
          <p className="mt-6 font-mono text-xs text-ash">尚無綁定碼</p>
        ) : (
          <ul className="mt-6 divide-y divide-black/10">
            {records.map((record) => (
              <li key={record.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="font-mono text-sm tracking-[0.16em]">{record.bindCode || "——"}</span>
                <span className="font-mono text-[11px] tracking-[0.14em]" style={{ color: FACTION_COLOR[record.faction] || "#5c5854" }}>
                  {record.faction}
                  {record.fileNo ? ` ${record.fileNo}` : ""}
                </span>
                <span className={`font-mono text-[11px] tracking-[0.14em] ${record.status === "bound" ? "text-signal" : "text-ash"}`}>
                  {record.status === "bound" ? "已綁定" : "未綁定"}
                </span>
                {record.name && record.name !== "未命名" && <span className="text-sm text-ash">{characterTitle(record)}</span>}
                <span className="ml-auto flex gap-2">
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
    </section>
  )
}
