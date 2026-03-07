import { useState } from 'react'
import { socket } from '../../socket/socket'
import { useGameStore } from '../../store/gameStore'
import Timer from '../ui/Timer'

const TOPIC_TIME_LIMIT = 30

export default function TopicInputPage() {
  const [topic, setTopic] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const { roomInfo, timeLeft } = useGameStore()

  function handleSubmit() {
    if (!topic.trim()) { setError('주제를 입력해주세요.'); return }
    setError('')
    socket.emit('topic:submit', { topic: topic.trim() }, res => {
      if (!res.success) { setError(res.error || '제출 실패'); return }
      setSubmitted(true)
    })
  }

  const submittedCount = roomInfo?.players.filter(p => p.isReady).length ?? 0
  const totalCount = roomInfo?.players.length ?? 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-800 text-center mb-1">
            주제를 입력하세요
          </h2>
          <p className="text-center text-gray-500 text-sm">
            상대방이 그림으로 전달할 주제를 적어주세요
          </p>
        </div>

        <div className="mb-4">
          <Timer totalSeconds={TOPIC_TIME_LIMIT} />
        </div>

        <div className="text-center text-sm text-gray-500 mb-6">
          제출 완료: {submittedCount} / {totalCount}명
        </div>

        {!submitted ? (
          <div className="space-y-4">
            <input
              type="text"
              maxLength={20}
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="예: 우주를 나는 고양이"
              autoFocus
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-purple-400 text-lg text-center"
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              onClick={handleSubmit}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-2xl text-lg transition-colors"
            >
              제출하기
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-6xl mb-3">✓</div>
            <p className="text-green-600 font-bold text-lg">제출 완료!</p>
            <p className="text-gray-500 text-sm mt-1">다른 사람들을 기다리는 중...</p>
          </div>
        )}
      </div>
    </div>
  )
}
