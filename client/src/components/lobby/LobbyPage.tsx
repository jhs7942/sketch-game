import { useState } from 'react'
import { socket } from '../../socket/socket'
import { useGameStore } from '../../store/gameStore'

export default function LobbyPage() {
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home')
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { setMyPlayer, setRoomInfo } = useGameStore()

  function connect(action: () => void) {
    if (!socket.connected) {
      socket.connect()
      socket.once('connect', action)
    } else {
      action()
    }
  }

  function handleCreate() {
    if (!name.trim()) { setError('닉네임을 입력해주세요.'); return }
    setLoading(true)
    setError('')

    connect(() => {
      socket.emit('room:create', { name: name.trim() }, res => {
        setLoading(false)
        if (!res.success || !res.player || !res.roomId) {
          setError(res.error || '방 생성에 실패했습니다.')
          return
        }
        setMyPlayer(res.player)
      })
    })
  }

  function handleJoin() {
    if (!name.trim()) { setError('닉네임을 입력해주세요.'); return }
    if (!roomCode.trim()) { setError('방 코드를 입력해주세요.'); return }
    setLoading(true)
    setError('')

    connect(() => {
      socket.emit('room:join', { roomId: roomCode.trim().toUpperCase(), name: name.trim() }, res => {
        setLoading(false)
        if (!res.success || !res.player || !res.room) {
          setError(res.error || '입장에 실패했습니다.')
          return
        }
        setMyPlayer(res.player)
        setRoomInfo(res.room)
      })
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-4xl font-black text-center text-gray-800 mb-2">
          스케치 게임
        </h1>
        <p className="text-center text-gray-500 mb-8 text-sm">
          그림으로 전달하는 이야기
        </p>

        {mode === 'home' && (
          <div className="space-y-3">
            <button
              onClick={() => setMode('create')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-2xl text-lg transition-colors"
            >
              방 만들기
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 rounded-2xl text-lg transition-colors"
            >
              방 입장하기
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            <button onClick={() => { setMode('home'); setError('') }} className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1">
              ← 뒤로
            </button>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">닉네임</label>
              <input
                type="text"
                maxLength={12}
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="닉네임 입력"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-400 text-gray-800"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-lg transition-colors"
            >
              {loading ? '생성 중...' : '방 만들기'}
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4">
            <button onClick={() => { setMode('home'); setError('') }} className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1">
              ← 뒤로
            </button>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">닉네임</label>
              <input
                type="text"
                maxLength={12}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="닉네임 입력"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-pink-400 text-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">방 코드</label>
              <input
                type="text"
                maxLength={6}
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="예: AB3K7F"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-pink-400 text-gray-800 tracking-widest font-mono uppercase"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleJoin}
              disabled={loading}
              className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-lg transition-colors"
            >
              {loading ? '입장 중...' : '입장하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
