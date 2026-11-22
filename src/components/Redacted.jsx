export default function Redacted({ children = "████", className = "" }) {
  return (
    <span className={`redacted ${className}`} title="權限不足 // REDACTED" aria-hidden="true">
      {children}
    </span>
  )
}
