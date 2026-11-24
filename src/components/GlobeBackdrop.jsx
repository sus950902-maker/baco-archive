import { useEffect, useRef } from "react"

export default function GlobeBackdrop() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return undefined
    const ctx = canvas.getContext("2d")
    if (!ctx) return undefined

    let frame = 0
    let rotation = 0.6
    let last = performance.now()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = parent.clientWidth
      const height = parent.clientHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = (now) => {
      const width = parent.clientWidth
      const height = parent.clientHeight
      const elapsed = Math.min(now - last, 48)
      last = now
      ctx.clearRect(0, 0, width, height)

      const cx = width * 0.5
      const cy = height * 0.5
      const radius = Math.min(width, height) * 0.4
      const tilt = 0.42
      const bands = 8
      const meridians = 12

      const project = (lat, lon) => {
        const x = Math.cos(lat) * Math.sin(lon + rotation)
        const y = Math.sin(lat)
        const z = Math.cos(lat) * Math.cos(lon + rotation)
        const yTilt = y * Math.cos(tilt) - z * Math.sin(tilt)
        const zTilt = y * Math.sin(tilt) + z * Math.cos(tilt)
        return {
          x: cx + x * radius,
          y: cy - yTilt * radius,
          z: zTilt,
        }
      }

      const stroke = (from, to) => {
        const depth = (from.z + to.z) / 2
        ctx.strokeStyle = depth > 0 ? "rgba(120, 120, 120, 0.55)" : "rgba(160, 160, 160, 0.28)"
        ctx.lineWidth = depth > 0 ? 1.8 : 1.15
        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(to.x, to.y)
        ctx.stroke()
      }

      for (let band = 1; band < bands; band += 1) {
        const lat = -Math.PI / 2 + (band * Math.PI) / bands
        let previous = project(lat, 0)
        for (let step = 1; step <= meridians; step += 1) {
          const next = project(lat, (step * Math.PI * 2) / meridians)
          stroke(previous, next)
          previous = next
        }
      }

      for (let meridian = 0; meridian < meridians; meridian += 1) {
        const lon = (meridian * Math.PI * 2) / meridians
        let previous = project(-Math.PI / 2, lon)
        for (let step = 1; step <= bands; step += 1) {
          const lat = -Math.PI / 2 + (step * Math.PI) / bands
          const next = project(lat, lon)
          stroke(previous, next)
          previous = next
        }
      }

      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.strokeStyle = "rgba(120, 120, 120, 0.45)"
      ctx.lineWidth = 1.6
      ctx.stroke()

      rotation += elapsed * 0.000035
      frame = window.requestAnimationFrame(draw)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(parent)
    frame = window.requestAnimationFrame(draw)
    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
}
