// The site's one icon: a drawn arrow that takes the text colour
export function Arrow({direction = 'up-right'}: {direction?: 'up-right' | 'right'}) {
  return (
    <svg className="arrow" viewBox="0 0 16 16" width="0.75em" height="0.75em" aria-hidden focusable="false">
      {direction === 'right' ? (
        <path d="M1 8h13M9 3l5 5-5 5" />
      ) : (
        <path d="M3 13L13 3M5 3h8v8" />
      )}
    </svg>
  )
}
