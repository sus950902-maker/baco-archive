export default function BureauMark({ className = "h-11 w-11" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <polygon
        points="32,3 57,17.5 57,46.5 32,61 7,46.5 7,17.5"
        fill="#11131A"
        stroke="#DC2626"
        strokeWidth="1.6"
      />
      <polygon
        points="32,11 49,20.5 49,43.5 32,53 15,43.5 15,20.5"
        stroke="#27272A"
        strokeWidth="1"
      />
      <path d="M18 32h6M40 32h6M32 18v6M32 40v6" stroke="#F59E0B" strokeWidth="1.2" />
      <ellipse cx="32" cy="32" rx="11" ry="6.5" stroke="#E2E8F0" strokeWidth="1.4" />
      <circle cx="32" cy="32" r="3" fill="#10B981" />
      <circle cx="32" cy="32" r="1.15" fill="#090A0F" />
    </svg>
  )
}
