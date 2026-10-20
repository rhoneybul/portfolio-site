export function Marquee({items, separator, className = ''}: {
  items: string[]
  separator?: React.ReactNode
  className?: string
}) {
  const row = (hidden?: boolean) => (
    <div className="marquee__row" aria-hidden={hidden}>
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className="marquee__item">
          {item}
          {separator && <span className="marquee__sep">{separator}</span>}
        </span>
      ))}
    </div>
  )
  return (
    <div className={`marquee ${className}`}>
      <div className="marquee__track">
        {row()}
        {row(true)}
      </div>
    </div>
  )
}
