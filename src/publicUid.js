import { collection, getDocs, limit, query, where } from "firebase/firestore"
import { db } from "./firebase"

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export function createPublicUid() {
  const values = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(values, (value) => ALPHABET[value % ALPHABET.length]).join("")
}

export async function issuePublicUid() {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const publicUid = createPublicUid()
    const existing = await getDocs(query(collection(db, "users"), where("publicUid", "==", publicUid), limit(1)))
    if (existing.empty) return publicUid
  }
  throw new Error("UID 核發失敗")
}
