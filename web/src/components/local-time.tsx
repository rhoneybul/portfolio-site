'use client'

import {useEffect, useState} from 'react'

export function LocalTime({timeZone = 'Europe/London'}: {timeZone?: string}) {
  const [time, setTime] = useState<string | null>(null)

  useEffect(() => {
    const format = () =>
      new Intl.DateTimeFormat('en-GB', {hour: '2-digit', minute: '2-digit', timeZone}).format(
        new Date(),
      )
    setTime(format())
    const id = setInterval(() => setTime(format()), 30_000)
    return () => clearInterval(id)
  }, [timeZone])

  return <span suppressHydrationWarning>{time ?? '--:--'}</span>
}
