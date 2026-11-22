import { createHash } from "node:crypto"

const PUBLIC_ID = /^[A-Za-z0-9][A-Za-z0-9_/.-]{0,254}$/

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" })
    return
  }

  const payload = typeof request.body === "string" ? JSON.parse(request.body) : request.body
  const publicId = payload?.publicId
  if (typeof publicId !== "string" || !PUBLIC_ID.test(publicId) || publicId.includes("..")) {
    response.status(400).json({ error: "Invalid publicId" })
    return
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) {
    response.status(500).json({ error: "Cloudinary is not configured" })
    return
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const signature = createHash("sha1")
    .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex")

  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: apiKey,
    signature,
  })

  const result = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
  const data = await result.json()
  response.status(result.ok ? 200 : result.status).json(data)
}
