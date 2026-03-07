import { useState } from 'react'
import { socket } from '../../socket/socket'
import { useGameStore } from '../../store/gameStore'
import Timer from '../ui/Timer'

export default function GuessTurn() {
  const { currentTurnData, roomInfo } = useGameStore()
  const [guess, setGuess] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  if (!currentTurnData) return null

  const submittedCount = roomInfo?.players.filter(p => p.isReady).length ?? 0
  const totalCount = roomInfo?.players.length ?? 0

  function handleSubmit() {
    if (!guess.trim()) { setError('추측을 입력해주세요.'); return }
    setError('')
    socket.emit('turn:submitGuess', { guess: guess.trim() }, res => {
      if (!res.success) { setError(res.error || '제출 실패'); return }
      setSubmitted(true)
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-400 to-pink-500 flex flex-col items-center justify-start p-4 pt-6">
      <div className="w-full max-w-3xl">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-500">
              그림 맞추기 ({submittedCount}/{totalCount}명 완료)
            </span>
            <span className="text-xs text-gray-400">
              턴 {currentTurnData.turnIndex} / {roomInfo?.totalTurns}
            </span>
          </div>
          <p className="text-center text-gray-500 text-sm">이 그림이 무엇을 표현하는지 적어주세요</p>
          <div className="mt-3">
            <Timer totalSeconds={currentTurnData.timeLimit} />
          </div>
        </div>

        {/* 그림 */}
        <div className="bg-white rounded-2xl shadow mb-4 overflow-hidden">
          <img
            src={currentTurnData.content}
            alt="그림"
            className="w-full object-contain"
            style={{ aspectRatio: '4/3' }}
          />
        </div>

        {/* 입력 */}
        {!submitted ? (
          <div className="bg-white rounded-2xl shadow p-4 space-y-3">
            <input
              type="text"
              maxLength={30}
              value={guess}
              onChange={e => setGuess(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="이 그림은 무엇일까요?"
              autoFocus
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-orange-400 text-lg text-center"
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              onClick={handleSubmit}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl text-lg transition-colors"
            >
              제출하기
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <div className="text-5xl mb-3">💡</div>
            <p className="text-orange-600 font-bold text-lg">제출 완료!</p>
            <p className="text-gray-500 text-sm mt-1">{submittedCount} / {totalCount}명 제출</p>
          </div>
        )}
      </div>
    </div>
  )
}
