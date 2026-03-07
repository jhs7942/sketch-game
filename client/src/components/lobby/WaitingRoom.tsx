import { useState } from 'react'
import { socket } from '../../socket/socket'
import { useGameStore } from '../../store/gameStore'

export default function WaitingRoom() {
  const { roomInfo, myPlayer } = useGameStore()
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  if (!roomInfo || !myPlayer) return null

  const isHost = myPlayer.isHost
  const canStart = roomInfo.players.length >= 1

  function handleStart() {
    setStarting(true)
    setError('')
    socket.emit('game:start', res => {
      setStarting(false)
      if (!res.success) setError(res.error || '시작 실패')
    })
  }

  function copyCode() {
    navigator.clipboard.writeText(roomInfo!.id)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg">
        <div className="text-center mb-6">
          <p className="text-gray-500 text-sm mb-1">방 코드</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-4xl font-black text-purple-600 tracking-widest font-mono">
              {roomInfo.id}
            </span>
            <button
              onClick={copyCode}
              className="text-gray-400 hover:text-purple-500 transition-colors text-sm border border-gray-200 rounded-lg px-2 py-1"
            >
              복사
            </button>
          </div>
          <p className="text-gray-400 text-xs mt-1">친구에게 이 코드를 공유하세요</p>
        </div>

        <div className="mb-6">
          <h3 className="font-bold text-gray-700 mb-3">
            참가자 ({roomInfo.players.length}/8)
          </h3>
          <div className="space-y-2">
            {roomInfo.players.map(player => (
              <div
                key={player.id}
                className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                  {player.name[0].toUpperCase()}
                </div>
                <span className="font-medium text-gray-800">{player.name}</span>
                {player.isHost && (
                  <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full">
                    방장
                  </span>
                )}
                {player.id === myPlayer.id && (
                  <span className="ml-auto text-xs bg-purple-100 text-purple-600 font-semibold px-2 py-0.5 rounded-full">
                    나
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}

        {isHost ? (
          <button
            onClick={handleStart}
            disabled={!canStart || starting}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold py-4 rounded-2xl text-lg transition-colors"
          >
            {starting ? '시작 중...' : '게임 시작'}
          </button>
        ) : (
          <div className="text-center text-gray-500 py-4">
            방장이 게임을 시작할 때까지 기다려주세요...
          </div>
        )}
      </div>
    </div>
  )
}
