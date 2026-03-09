import cors from 'cors'
import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import {
  ClientToServerEvents,
  ServerToClientEvents,
  StrokePayload,
} from '@sketch-game/shared'
import {
  DRAW_TIME_LIMIT,
  GUESS_TIME_LIMIT,
  TOPIC_TIME_LIMIT,
  advanceTurn,
  createRoom,
  getChainIndexForPlayer,
  getContentForPlayer,
  getCurrentStepType,
  getRoom,
  getTurnTimeLimit,
  joinRoom,
  removePlayer,
  startGame,
  startPlaying,
  submitTopic,
  submitTurn,
  toRoomInfo,
} from './game/gameManager'

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
})

// 플레이어가 어느 방에 속하는지 추적
const playerRoomMap = new Map<string, string>()
// 방별 타이머 관리
const roomTimers = new Map<string, ReturnType<typeof setTimeout>>()

function clearRoomTimer(roomId: string) {
  const timer = roomTimers.get(roomId)
  if (timer) {
    clearTimeout(timer)
    roomTimers.delete(roomId)
  }
}

function startTurnTimer(roomId: string, seconds: number, onExpire: () => void) {
  clearRoomTimer(roomId)
  const timer = setTimeout(onExpire, seconds * 1000)
  roomTimers.set(roomId, timer)
}

// 다음 턴을 시작하고 클라이언트에 이벤트 전송
function broadcastTurnStart(roomId: string) {
  const room = getRoom(roomId)
  if (!room || room.state !== 'PLAYING') return

  const stepType = getCurrentStepType(room)
  const timeLimit = getTurnTimeLimit(room)

  // 각 플레이어에게 개인화된 데이터 전송
  room.players.forEach(player => {
    const content = getContentForPlayer(room, player.id)
    if (!content) return

    const socket = io.sockets.sockets.get(player.id)
    if (socket) {
      socket.emit('turn:start', {
        turnIndex: room.currentTurn,
        stepType,
        content: content.content,
        contentType: content.contentType,
        timeLimit,
      })
    }
  })

  // 타이머: 제한 시간 지나면 강제로 다음 턴
  startTurnTimer(roomId, timeLimit, () => {
    handleAllSubmitted(roomId)
  })
}

// 모든 플레이어가 제출했을 때 처리
function handleAllSubmitted(roomId: string) {
  clearRoomTimer(roomId)
  const room = getRoom(roomId)
  if (!room) return

  // 미제출 플레이어에 대해 빈 콘텐츠 자동 제출
  if (room.state === 'PLAYING') {
    const stepType = getCurrentStepType(room)
    room.players.forEach(player => {
      if (!player.isReady) {
        submitTurn(roomId, player.id, '', stepType)
      }
    })
  }

  const updated = advanceTurn(roomId)
  if (!updated) return

  if (updated.state === 'RESULT') {
    io.to(roomId).emit('game:result', { chains: updated.chains })
  } else {
    io.to(roomId).emit('room:updated', toRoomInfo(updated))
    broadcastTurnStart(roomId)
  }
}

io.on('connection', socket => {
  console.log(`[연결] ${socket.id}`)

  // 방 생성
  socket.on('room:create', ({ name }, callback) => {
    if (!name?.trim()) {
      callback({ success: false, error: '닉네임을 입력해주세요.' })
      return
    }
    const room = createRoom(socket.id, name.trim())
    socket.join(room.id)
    playerRoomMap.set(socket.id, room.id)

    const player = room.players.find(p => p.id === socket.id)!
    callback({ success: true, roomId: room.id, player })
    io.to(room.id).emit('room:updated', toRoomInfo(room))
    console.log(`[방 생성] ${room.id} by ${name}`)
  })

  // 방 입장
  socket.on('room:join', ({ roomId, name }, callback) => {
    if (!name?.trim() || !roomId?.trim()) {
      callback({ success: false, error: '입력 값이 올바르지 않습니다.' })
      return
    }
    const room = joinRoom(roomId.toUpperCase(), socket.id, name.trim())
    if (!room) {
      callback({ success: false, error: '방을 찾을 수 없거나 입장할 수 없습니다.' })
      return
    }
    socket.join(room.id)
    playerRoomMap.set(socket.id, room.id)

    const player = room.players.find(p => p.id === socket.id)!
    callback({ success: true, room: toRoomInfo(room), player })
    io.to(room.id).emit('room:updated', toRoomInfo(room))
    console.log(`[방 입장] ${room.id} by ${name}`)
  })

  // 게임 시작
  socket.on('game:start', callback => {
    const roomId = playerRoomMap.get(socket.id)
    if (!roomId) { callback({ success: false, error: '방을 찾을 수 없습니다.' }); return }

    const room = getRoom(roomId)
    if (!room) { callback({ success: false, error: '방을 찾을 수 없습니다.' }); return }
    if (!room.players.find(p => p.id === socket.id)?.isHost) {
      callback({ success: false, error: '호스트만 게임을 시작할 수 있습니다.' }); return
    }

    const started = startGame(roomId)
    if (!started) { callback({ success: false, error: '게임 시작에 실패했습니다.' }); return }

    callback({ success: true })
    io.to(roomId).emit('game:started', toRoomInfo(started))
    io.to(roomId).emit('topic:phase', { timeLimit: TOPIC_TIME_LIMIT })

    // 주제 입력 타이머
    startTurnTimer(roomId, TOPIC_TIME_LIMIT, () => {
      // 미제출 플레이어는 랜덤 주제로 채움
      const currentRoom = getRoom(roomId)
      if (!currentRoom || currentRoom.state !== 'TOPIC_INPUT') return

      currentRoom.players.forEach(player => {
        const chain = currentRoom.chains.find(c => c.ownerId === player.id)
        if (chain && chain.steps.length === 0) {
          chain.steps.push({
            type: 'text',
            content: getRandomTopic(),
            authorId: player.id,
            authorName: player.name,
          })
        }
      })

      const playing = startPlaying(roomId)
      if (!playing) return
      io.to(roomId).emit('room:updated', toRoomInfo(playing))
      broadcastTurnStart(roomId)
    })
  })

  // 주제 제출
  socket.on('topic:submit', ({ topic }, callback) => {
    const roomId = playerRoomMap.get(socket.id)
    if (!roomId) { callback({ success: false, error: '방 정보 없음' }); return }
    if (!topic?.trim()) { callback({ success: false, error: '주제를 입력해주세요.' }); return }

    const result = submitTopic(roomId, socket.id, topic.trim())
    if (!result) { callback({ success: false, error: '주제 제출 실패' }); return }

    callback({ success: true })
    io.to(roomId).emit('room:updated', toRoomInfo(result.room))

    if (result.allSubmitted) {
      clearRoomTimer(roomId)
      const playing = startPlaying(roomId)
      if (!playing) return
      io.to(roomId).emit('room:updated', toRoomInfo(playing))
      broadcastTurnStart(roomId)
    }
  })

  // 그림 제출
  socket.on('turn:submitDrawing', ({ imageData }, callback) => {
    const roomId = playerRoomMap.get(socket.id)
    if (!roomId) { callback({ success: false, error: '방 정보 없음' }); return }

    const result = submitTurn(roomId, socket.id, imageData, 'drawing')
    if (!result) { callback({ success: false, error: '제출 실패' }); return }

    callback({ success: true })
    io.to(roomId).emit('turn:submitted', { playerId: socket.id })
    io.to(roomId).emit('room:updated', toRoomInfo(result.room))

    if (result.allSubmitted) handleAllSubmitted(roomId)
  })

  // 추측 제출
  socket.on('turn:submitGuess', ({ guess }, callback) => {
    const roomId = playerRoomMap.get(socket.id)
    if (!roomId) { callback({ success: false, error: '방 정보 없음' }); return }
    if (!guess?.trim()) { callback({ success: false, error: '추측을 입력해주세요.' }); return }

    const result = submitTurn(roomId, socket.id, guess.trim(), 'text')
    if (!result) { callback({ success: false, error: '제출 실패' }); return }

    callback({ success: true })
    io.to(roomId).emit('turn:submitted', { playerId: socket.id })
    io.to(roomId).emit('room:updated', toRoomInfo(result.room))

    if (result.allSubmitted) handleAllSubmitted(roomId)
  })

  // 캔버스 스트로크 브로드캐스트
  socket.on('canvas:stroke', (payload: StrokePayload) => {
    const roomId = playerRoomMap.get(socket.id)
    if (!roomId) return
    socket.to(roomId).emit('canvas:stroke', payload)
  })

  // 연결 해제
  socket.on('disconnect', () => {
    const roomId = playerRoomMap.get(socket.id)
    if (!roomId) return

    playerRoomMap.delete(socket.id)
    const updated = removePlayer(roomId, socket.id)

    if (updated) {
      io.to(roomId).emit('room:updated', toRoomInfo(updated))
    }
    console.log(`[연결 해제] ${socket.id} from room ${roomId}`)
  })
})

app.get('/health', (_, res) => res.json({ status: 'ok' }))

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`)
})

function getRandomTopic(): string {
  const topics = [
    '고양이', '강아지', '자전거', '피자', '로켓',
    '무지개', '나무', '자동차', '케이크', '해', '달',
  ]
  return topics[Math.floor(Math.random() * topics.length)]
}
