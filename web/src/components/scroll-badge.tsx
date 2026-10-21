export function ScrollBadge({href = '#about'}: {href?: string}) {
  return (
    <a href={href} className="scroll-badge" aria-label="Scroll down to learn more">
      <svg viewBox="0 0 120 120" className="scroll-badge__text" aria-hidden>
        <defs>
          <path id="badge-circle" d="M60 60 m-46 0 a46 46 0 1 1 92 0 a46 46 0 1 1 -92 0" />
        </defs>
        <text>
          <textPath href="#badge-circle">scroll down • explore more about me • </textPath>
        </text>
      </svg>
      <span className="scroll-badge__arrow" aria-hidden>
        ↓︎
      </span>
    </a>
  )
}
