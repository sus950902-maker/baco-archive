import {
  collection,
  doc,
  getDoc,
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

export const FACTIONS = ["調查員", "異常", "民眾"]

export const FACTION_COLOR = {
  調查員: "#10b981",
  異常: "#f59e0b",
  民眾: "#38bdf8",
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
  const characterRef = doc(collection(db, "characters"))
  const batch = writeBatch(db)
  batch.set(characterRef, {
    uid: serial,
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
  return { id: characterRef.id, uid: serial, bindCode }
}

export async function issueBindCode(faction) {
  if (!FACTIONS.includes(faction)) throw new Error("請先選擇陣營")
  return createCharacter({
    name: "",
    faction,
    department: DEPARTMENTS[4],
    bio: "",
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
  return record
}

export async function removeCharacter(character) {
  const batch = writeBatch(db)
  batch.delete(doc(db, "characters", character.id))
  if (character.bindCode) batch.delete(doc(db, "binds", character.bindCode))
  await batch.commit()
}

export function publicCharacter(id, data) {
  return {
    id,
    uid: data.uid || "",
    status: data.status || "unassigned",
    ownerUid: data.ownerUid || null,
    ownerName: data.ownerName || "",
    name: data.name || "未命名",
    faction: data.faction || "",
    department: data.department || "",
    avatarUrl: data.avatarUrl || "",
    avatarPublicId: data.avatarPublicId || "",
    idCardUrl: data.idCardUrl || "",
    idCardPublicId: data.idCardPublicId || "",
    bio: data.bio || "",
  }
}
