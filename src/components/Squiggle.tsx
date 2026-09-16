export function Squiggle({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 500"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M40 20 C40 120, 200 60, 200 160 C200 260, 40 200, 40 300 C40 400, 200 340, 200 440 C200 470, 180 490, 150 490"
        stroke="#C6FF4A"
        strokeWidth="34"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function ZigzagMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 12" className={className} aria-hidden="true">
      <path
        d="M0 6 L6 0 L12 6 L18 0 L24 6 L30 0 L36 6 L42 0 L48 6 L54 0 L60 6"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  )
}

export function SparkMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="currentColor" />
    </svg>
  )
}
