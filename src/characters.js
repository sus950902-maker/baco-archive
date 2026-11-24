import {
  addDoc,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore"
import { db } from "./firebase"

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export const FACTIONS = ["調查員", "異常", "民眾", "議會"]

export const FACTION_COLOR = {
  調查員: "#10b981",
  異常: "#f59e0b",
  民眾: "#38bdf8",
  議會: "#dc2626",
}

export const DEPARTMENTS = [
  "第一收容機動部 CTD",
  "異常觀測與勘查部 OFSD",
  "精神防護與認知干預科 CDMU",
  "方舟維穩與善後工程部 PASRC",
  "無 / 民間",
]

export function isStaffRole(role) {
  return role === "moderator" || role === "admin"
}

export function roleFromClearance(level) {
  if (level === "high") return "admin"
  if (level === "mid") return "moderator"
  return "user"
}

function randomChunk(length) {
  const values = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(values, (value) => ALPHABET[value % ALPHABET.length]).join("")
}

export function normalizeBindCode(value) {
  const raw = String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
  if (raw.length !== 8) return ""
  return `${raw.slice(0, 4)}-${raw.slice(4)}`
}

const NUMBERED_FACTIONS = ["調查員", "異常"]

function padFileNo(value) {
  return String(value).padStart(3, "0")
}

async function factionRows(faction) {
  const snap = await getDocs(query(collection(db, "characters"), where("faction", "==", faction)))
  return snap.docs
}

export async function assignFileNumbers(faction) {
  if (!NUMBERED_FACTIONS.includes(faction)) return
  const rows = await factionRows(faction)
  let max = 0
  const pending = []
  rows.forEach((entry) => {
    if (entry.data().faction !== faction) return
    const raw = String(entry.data().fileNo || "")
    const value = /^\d+$/.test(raw) ? Number(raw) : 0
    if (value > 0) max = Math.max(max, value)
    else pending.push(entry)
  })
  if (!pending.length) return
  pending.sort((a, b) => {
    const left = a.data().createdAt?.toMillis?.() || 0
    const right = b.data().createdAt?.toMillis?.() || 0
    if (left !== right) return left - right
    return a.id.localeCompare(b.id)
  })
  const batch = writeBatch(db)
  pending.forEach((entry) => {
    max += 1
    batch.update(entry.ref, { fileNo: padFileNo(max) })
  })
  await batch.commit()
}

async function reserveFileNo(faction) {
  if (!NUMBERED_FACTIONS.includes(faction)) return ""
  await assignFileNumbers(faction)
  const rows = await factionRows(faction)
  let max = 0
  rows.forEach((entry) => {
    if (entry.data().faction !== faction) return
    const raw = String(entry.data().fileNo || "")
    const value = /^\d+$/.test(raw) ? Number(raw) : 0
    if (value > 0) max = Math.max(max, value)
  })
  return padFileNo(max + 1)
}

async function uniqueSerial() {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const serial = `BACO-${randomChunk(4)}`
    const existing = await getDocs(query(collection(db, "characters"), where("uid", "==", serial), limit(1)))
    if (existing.empty) return serial
  }
  throw new Error("角色編號核發失敗")
}

async function uniqueBindCode() {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = `${randomChunk(4)}-${randomChunk(4)}`
    const existing = await getDoc(doc(db, "binds", code))
    if (!existing.exists()) return code
  }
  throw new Error("綁定碼核發失敗")
}

export async function createCharacter(input) {
  const serial = await uniqueSerial()
  const bindCode = await uniqueBindCode()
  const fileNo = input.fileNo || (await reserveFileNo(input.faction))
  const characterRef = doc(collection(db, "characters"))
  const batch = writeBatch(db)
  batch.set(characterRef, {
    uid: serial,
    fileNo,
    bindCode,
    status: "unassigned",
    ownerUid: null,
    ownerName: null,
    name: input.name,
    faction: input.faction,
    department: input.department,
    avatarUrl: input.avatarUrl || "",
    avatarPublicId: input.avatarPublicId || "",
    idCardUrl: input.idCardUrl || "",
    idCardPublicId: input.idCardPublicId || "",
    bio: input.bio || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  batch.set(doc(db, "binds", bindCode), { characterId: characterRef.id, faction: input.faction })
  await batch.commit()
  return { id: characterRef.id, uid: serial, fileNo, bindCode }
}

export async function issueBindCode(faction, councilCode = "") {
  if (!FACTIONS.includes(faction)) throw new Error("請先選擇陣營")
  let fileNo = ""
  if (faction === "議會") {
    fileNo = String(councilCode || "").trim()
    if (!fileNo) throw new Error("請填寫議會代號")
    const rows = await factionRows("議會")
    if (rows.some((entry) => entry.data().fileNo === fileNo)) throw new Error("此代號已被使用")
  }
  return createCharacter({
    name: "",
    faction,
    department: DEPARTMENTS[4],
    bio: "",
    fileNo,
  })
}

export async function claimCharacter(rawCode, user, profile) {
  const bindCode = normalizeBindCode(rawCode)
  if (!bindCode) {
    const error = new Error("綁定碼格式不符")
    error.code = "invalid"
    throw error
  }
  const lookup = await getDoc(doc(db, "binds", bindCode))
  if (!lookup.exists()) {
    const error = new Error("綁定碼無效，檔案不存在")
    error.code = "invalid"
    throw error
  }
  const characterRef = doc(db, "characters", lookup.data().characterId)
  try {
    await updateDoc(characterRef, {
      status: "bound",
      ownerUid: user.uid,
      ownerName: profile?.displayName || user.displayName || user.email || "未命名",
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    if (error.code !== "permission-denied") throw error
  }
  const snap = await getDoc(characterRef)
  if (!snap.exists()) {
    const error = new Error("綁定碼無效，檔案不存在")
    error.code = "invalid"
    throw error
  }
  const record = { ...publicCharacter(snap.id, snap.data()), bindCode: snap.data().bindCode || bindCode }
  if (record.ownerUid !== user.uid) {
    const error = new Error("該檔案已被其他帳號綁定")
    error.code = "taken"
    throw error
  }
  if (!isStaffRole(profile?.role)) {
    try {
      await setDoc(doc(db, "users", user.uid), { role: "low", updatedAt: serverTimestamp() }, { merge: true })
    } catch {
      // 角色已綁定。低級權限會在下次登入時再寫入。
    }
  }
  return record
}

export async function publishCharacterAnnouncement(record) {
  const name = record.name || "未命名"
  const faction = record.faction || ""
  const fileNo = record.fileNo || ""
  const code = `${faction}${fileNo}`
  await addDoc(collection(db, "announcements"), {
    text: code ? `${code} ${name} 已錄入檔案數據庫` : `${name} 已錄入檔案數據庫`,
    faction,
    fileNo,
    characterName: name,
    characterId: record.id,
    createdAt: serverTimestamp(),
  })
}

export function readAnnouncement(id, data) {
  const text = data.text || ""
  const saved = {
    id,
    text,
    faction: data.faction || "",
    fileNo: data.fileNo || "",
    characterName: data.characterName || "",
    createdAt: data.createdAt?.toMillis?.() || 0,
  }
  if (saved.faction || saved.characterName) return saved
  const body = text.replace(/^創角公告\s*/, "")
  const suffix = "已錄入檔案數據庫"
  if (!body.endsWith(suffix)) return saved
  const head = body.slice(0, -suffix.length).trim()
  const faction = FACTIONS.find((item) => head.startsWith(item)) || ""
  const after = (faction ? head.slice(faction.length) : head).trim().replace(/^[-]+/, "")
  const split = after.match(/^([A-Za-z0-9]+)(?:[-\s]+)(.+)$/)
  if (split) return { ...saved, faction, fileNo: split[1], characterName: split[2].trim() }
  if (faction || after) return { ...saved, faction, characterName: after }
  return saved
}

export async function removeCharacter(character) {
  const batch = writeBatch(db)
  batch.delete(doc(db, "characters", character.id))
  if (character.bindCode) batch.delete(doc(db, "binds", character.bindCode))
  await batch.commit()
}

export function characterTitle(record) {
  return record?.name || "未命名"
}

export function factionLabel(record) {
  const faction = record?.faction || ""
  if ((faction === "調查員" || faction === "異常") && record?.fileNo) return `${faction} ${record.fileNo}`
  return faction
}

export function publicCharacter(id, data) {
  return {
    id,
    uid: data.uid || "",
    fileNo: data.fileNo || "",
    status: data.status || "unassigned",
    ownerUid: data.ownerUid || null,
    ownerName: data.ownerName || "",
    name: data.name || "未命名",
    faction: data.faction || "",
    department: data.department || "",
    avatarUrl: data.avatarUrl || "",
    avatarPublicId: data.avatarPublicId || "",
    portraitUrl: data.portraitUrl || "",
    portraitPublicId: data.portraitPublicId || "",
    portraitX: Number.isFinite(data.portraitX) ? data.portraitX : null,
    portraitY: Number.isFinite(data.portraitY) ? data.portraitY : null,
    portraitScale: Number.isFinite(data.portraitScale) && data.portraitScale >= 1 ? data.portraitScale : 1,
    idCardUrl: data.idCardUrl || "",
    idCardPublicId: data.idCardPublicId || "",
    bio: data.bio || "",
    createdAt: data.createdAt?.toMillis?.() || 0,
  }
}
