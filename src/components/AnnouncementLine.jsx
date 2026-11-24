import { FACTION_COLOR } from "../characters"

export default function AnnouncementLine({ item, className }) {
  const color = FACTION_COLOR[item.faction]
  if (!color || (!item.faction && !item.fileNo && !item.characterName)) {
    return <p className={className}>{item.text}</p>
  }
  return (
    <p className={className}>
      <span style={{ color }}>{item.faction}{item.fileNo}</span>
      {item.characterName ? <span style={{ color }}> {item.characterName}</span> : null}
      <span> 已錄入檔案數據庫</span>
    </p>
  )
}
