import {
  Chain,
  GameState,
  Player,
  RoomInfo,
  Step,
  StepType,
} from '@sketch-game/shared'

export const TOPIC_TIME_LIMIT = 30   // 주제 입력 제한 시간 (초)
export const DRAW_TIME_LIMIT = 90    // 그림 그리기 제한 시간 (초)
export const GUESS_TIME_LIMIT = 40   // 추측 제한 시간 (초)

export interface Room {
  id: string
  players: Player[]
  state: GameState
  chains: Chain[]
  currentTurn: number
  timer: ReturnType<typeof setTimeout> | null
  submittedCount: number  // 현재 턴에서 제출한 인원
}

const rooms = new Map<string, Room>()

export function createRoom(hostId: string, hostName: string): Room {
  const roomId = generateRoomId()
  const host: Player = {
    id: hostId,
    name: hostName,
    isHost: true,
    isReady: false,
  }
  const room: Room = {
    id: roomId,
    players: [host],
    state: 'WAITING',
    chains: [],
    currentTurn: 0,
    timer: null,
    submittedCount: 0,
  }
  rooms.set(roomId, room)
  return room
}

export function joinRoom(roomId: string, playerId: string, playerName: string): Room | null {
  const room = rooms.get(roomId)
  if (!room) return null
  if (room.state !== 'WAITING') return null
  if (room.players.length >= 8) return null
  // 중복 닉네임 방지
  if (room.players.some(p => p.name === playerName)) return null

  room.players.push({
    id: playerId,
    name: playerName,
    isHost: false,
    isReady: false,
  })
  return room
}

export function removePlayer(roomId: string, playerId: string): Room | null {
  const room = rooms.get(roomId)
  if (!room) return null

  room.players = room.players.filter(p => p.id !== playerId)

  // 방이 비면 삭제
  if (room.players.length === 0) {
    if (room.timer) clearTimeout(room.timer)
    rooms.delete(roomId)
    return null
  }

  // 호스트가 나가면 다음 사람에게 호스트 이관
  if (!room.players.some(p => p.isHost)) {
    room.players[0].isHost = true
  }

  return room
}

export function startGame(roomId: string): Room | null {
  const room = rooms.get(roomId)
  if (!room) return null
  if (room.players.length < 1) return null

  // 체인 초기화
  room.chains = room.players.map(p => ({
    ownerId: p.id,
    ownerName: p.name,
    steps: [],
  }))
  room.state = 'TOPIC_INPUT'
  room.currentTurn = 0
  room.submittedCount = 0

  // 모든 플레이어 isReady 초기화
  room.players.forEach(p => (p.isReady = false))

  return room
}

export function submitTopic(roomId: string, playerId: string, topic: string): { room: Room; allSubmitted: boolean } | null {
  const room = rooms.get(roomId)
  if (!room || room.state !== 'TOPIC_INPUT') return null

  const chain = room.chains.find(c => c.ownerId === playerId)
  if (!chain || chain.steps.length > 0) return null

  const player = room.players.find(p => p.id === playerId)
  if (!player) return null

  chain.steps.push({ type: 'text', content: topic, authorId: playerId, authorName: player.name })
  player.isReady = true
  room.submittedCount++

  const allSubmitted = room.submittedCount >= room.players.length
  return { room, allSubmitted }
}

// 턴 제출 (그림 or 추측)
export function submitTurn(
  roomId: string,
  playerId: string,
  content: string,
  type: StepType
): { room: Room; allSubmitted: boolean } | null {
  const room = rooms.get(roomId)
  if (!room || room.state !== 'PLAYING') return null

  const player = room.players.find(p => p.id === playerId)
  if (!player || player.isReady) return null

  // 이번 턴에 이 플레이어가 받은 체인 인덱스
  const chainIndex = getChainIndexForPlayer(room, playerId)
  const chain = room.chains[chainIndex]
  if (!chain) return null

  chain.steps.push({ type, content, authorId: playerId, authorName: player.name })
  player.isReady = true
  room.submittedCount++

  const allSubmitted = room.submittedCount >= room.players.length
  return { room, allSubmitted }
}

// 다음 턴으로 전환
export function advanceTurn(roomId: string): Room | null {
  const room = rooms.get(roomId)
  if (!room) return null

  room.currentTurn++
  room.submittedCount = 0
  room.players.forEach(p => (p.isReady = false))

  if (room.currentTurn >= room.players.length) {
    room.state = 'RESULT'
  } else {
    room.state = 'PLAYING'
  }

  return room
}

export function startPlaying(roomId: string): Room | null {
  const room = rooms.get(roomId)
  if (!room) return null

  room.state = 'PLAYING'
  room.currentTurn = 1  // 0번은 주제 입력, 1번 턴부터 그림/추측
  room.submittedCount = 0
  room.players.forEach(p => (p.isReady = false))

  return room
}

// 현재 턴에서 플레이어가 받아야 할 체인 인덱스 계산
// turnIndex번째 턴에서 playerIndex번째 플레이어는 (playerIndex - turnIndex) mod n 번 체인을 받음
export function getChainIndexForPlayer(room: Room, playerId: string): number {
  const playerIndex = room.players.findIndex(p => p.id === playerId)
  const n = room.players.length
  // 1턴부터 시작하므로 currentTurn - 1 로 오프셋 계산
  return ((playerIndex - (room.currentTurn - 1)) % n + n) % n
}

// 현재 턴에서 플레이어가 봐야 할 이전 스텝 내용
export function getContentForPlayer(room: Room, playerId: string): { content: string; contentType: StepType } | null {
  const chainIndex = getChainIndexForPlayer(room, playerId)
  const chain = room.chains[chainIndex]
  if (!chain || chain.steps.length === 0) return null

  const lastStep = chain.steps[chain.steps.length - 1]
  return { content: lastStep.content, contentType: lastStep.type }
}

// 현재 턴 타입 (홀수: 그림 그리기, 짝수: 추측)
export function getCurrentStepType(room: Room): StepType {
  return room.currentTurn % 2 === 1 ? 'drawing' : 'text'
}

export function getTurnTimeLimit(room: Room): number {
  return getCurrentStepType(room) === 'drawing' ? DRAW_TIME_LIMIT : GUESS_TIME_LIMIT
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId)
}

export function toRoomInfo(room: Room): RoomInfo {
  return {
    id: room.id,
    players: room.players,
    state: room.state,
    currentTurn: room.currentTurn,
    totalTurns: room.players.length,
    turnTimeLimit: room.state === 'TOPIC_INPUT'
      ? TOPIC_TIME_LIMIT
      : getTurnTimeLimit(room),
  }
}

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return rooms.has(result) ? generateRoomId() : result
}
