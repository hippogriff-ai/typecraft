interface CountdownProps {
  value: number
}

export function Countdown({ value }: CountdownProps) {
  return (
    <div className="countdown" data-testid="countdown">
      {value}
    </div>
  )
}
