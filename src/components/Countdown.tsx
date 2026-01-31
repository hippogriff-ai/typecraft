interface CountdownProps {
  value: number
}

export function Countdown({ value }: CountdownProps) {
  return (
    <div className="countdown" data-testid="countdown" role="status" aria-live="assertive" aria-label={`${value}`}>
      {value}
    </div>
  )
}
