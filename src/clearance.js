const STORAGE_KEY = "baco-clearance"

const CODES = {
  mid: "ABCO2155489",
  high: "ABCO0938159",
}

export function matchClearance(value) {
  const code = value.trim().toUpperCase()
  if (code === CODES.high) return "high"
  if (code === CODES.mid) return "mid"
  return null
}

export function readStoredClearance(uid) {
  if (!uid) return null
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
    const level = saved[uid]
    return level === "mid" || level === "high" ? level : null
  } catch {
    return null
  }
}

export function storeClearance(uid, level) {
  if (!uid || (level !== "mid" && level !== "high")) return
  let saved = {}
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
  } catch {
    saved = {}
  }
  saved[uid] = level
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
}
