import { useGameStore } from '../../store/gameStore'

interface TimerProps {
  totalSeconds: number
}

export default function Timer({ totalSeconds }: TimerProps) {
  const timeLeft = useGameStore(s => s.timeLeft)
  const ratio = totalSeconds > 0 ? timeLeft / totalSeconds : 0
  const isUrgent = timeLeft <= 10

  const color = isUrgent
    ? 'bg-red-500'
    : ratio > 0.5
    ? 'bg-green-500'
    : 'bg-yellow-400'

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <span className={`text-lg font-bold w-10 text-right ${isUrgent ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}>
        {timeLeft}s
      </span>
    </div>
  )
}
