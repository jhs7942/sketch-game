import { useState } from 'react'
import { socket } from '../../socket/socket'
import { useGameStore } from '../../store/gameStore'
import DrawingCanvas from '../canvas/DrawingCanvas'
import Timer from '../ui/Timer'

export default function DrawingTurn() {
  const { currentTurnData, roomInfo, timeLeft } = useGameStore()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  if (!currentTurnData) return null

  const submittedCount = roomInfo?.players.filter(p => p.isReady).length ?? 0
  const totalCount = roomInfo?.players.length ?? 0

  function handleExport(dataUrl: string) {
    socket.emit('turn:submitDrawing', { imageData: dataUrl }, res => {
      if (!res.success) { setError(res.error || '제출 실패'); return }
      setSubmitted(true)
      setError('')
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-teal-500 to-blue-500 flex flex-col items-center justify-start p-4 pt-6">
      <div className="w-full max-w-3xl">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-500">
              그림 그리기 ({submittedCount}/{totalCount}명 완료)
            </span>
            <span className="text-xs text-gray-400">
              턴 {currentTurnData.turnIndex} / {roomInfo?.totalTurns}
            </span>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">이 주제를 그려주세요</p>
            <p className="text-2xl font-black text-gray-800 bg-yellow-50 rounded-xl px-4 py-2 inline-block">
              {currentTurnData.content}
            </p>
          </div>
          <div className="mt-3">
            <Timer totalSeconds={currentTurnData.timeLimit} />
          </div>
        </div>

        {!submitted ? (
          <DrawingCanvas onExport={handleExport} />
        ) : (
          <div className="bg-white rounded-2xl shadow p-12 text-center">
            <div className="text-6xl mb-3">🎨</div>
            <p className="text-green-600 font-bold text-xl">제출 완료!</p>
            <p className="text-gray-500 text-sm mt-2">다른 사람들을 기다리는 중...</p>
            <p className="text-gray-400 text-xs mt-1">{submittedCount} / {totalCount}명 제출</p>
          </div>
        )}

        {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
      </div>
    </div>
  )
}
