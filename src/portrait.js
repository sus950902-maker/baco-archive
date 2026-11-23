export const PORTRAIT_TOP = 0.28

export function driveId(value) {
  try {
    const url = new URL(String(value || "").trim())
    const host = url.hostname.replace(/^www\./, "")
    if (host === "drive.google.com" || host === "docs.google.com") {
      return url.pathname.match(/\/d\/([^/]+)/)?.[1] || url.searchParams.get("id") || ""
    }
    if (host === "lh3.googleusercontent.com") return url.pathname.match(/\/d\/([^/=]+)/)?.[1] || ""
  } catch {
    return ""
  }
  return ""
}

export function portraitSources(value) {
  try {
    const url = new URL(String(value || "").trim())
    if (url.protocol !== "https:" && url.protocol !== "http:") return []
    const host = url.hostname.replace(/^www\./, "")
    const id = driveId(url.href)
    if (id && (host === "drive.google.com" || host === "docs.google.com" || host === "lh3.googleusercontent.com")) {
      return [`https://lh3.googleusercontent.com/d/${id}=s1600`, `https://drive.google.com/thumbnail?id=${id}&sz=w1600`]
    }
    if (host.endsWith("dropbox.com")) {
      url.hostname = "dl.dropboxusercontent.com"
      url.searchParams.set("raw", "1")
      url.searchParams.delete("dl")
      return [url.href]
    }
    return [url.href]
  } catch {
    return []
  }
}

export function fitPortrait(natural, frame, zoom = 1) {
  if (!natural?.width || !natural?.height || !frame.width || !frame.height) return { width: 0, height: 0 }
  const maxWidth = frame.width
  const maxHeight = frame.height * (1 + PORTRAIT_TOP)
  const scale = Math.min(maxWidth / natural.width, maxHeight / natural.height) * Math.max(zoom, 1)
  return { width: natural.width * scale, height: natural.height * scale }
}

export function clampPortrait(x, y, frame, size) {
  const minX = Math.min(0, frame.width - size.width)
  const maxX = Math.max(0, frame.width - size.width)
  const minY = Math.min(-frame.height * PORTRAIT_TOP, frame.height - size.height)
  const maxY = Math.max(-frame.height * PORTRAIT_TOP, frame.height - size.height)
  return {
    x: Math.min(maxX, Math.max(minX, x)),
    y: Math.min(maxY, Math.max(minY, y)),
  }
}

export function portraitOffset(ratio, frame, size) {
  if (!Number.isFinite(ratio?.x) || !Number.isFinite(ratio?.y)) {
    return clampPortrait((frame.width - size.width) / 2, frame.height - size.height, frame, size)
  }
  return clampPortrait(ratio.x * frame.width, ratio.y * frame.height, frame, size)
}

export function portraitRatio(offset, frame) {
  if (!frame.width || !frame.height) return { x: 0, y: 0 }
  return { x: offset.x / frame.width, y: offset.y / frame.height }
}
