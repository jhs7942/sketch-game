// 게임 상태
export type GameState = 'WAITING' | 'TOPIC_INPUT' | 'PLAYING' | 'RESULT'

// 턴 타입
export type StepType = 'text' | 'drawing'

// 체인의 각 단계
export interface Step {
  type: StepType
  content: string       // 텍스트 또는 base64 이미지
  authorId: string
  authorName: string
}

// 하나의 주제 체인
export interface Chain {
  ownerId: string
  ownerName: string
  steps: Step[]
}

// 플레이어
export interface Player {
  id: string
  name: string
  isHost: boolean
  isReady: boolean      // 현재 턴 제출 완료 여부
}

// 방 정보 (클라이언트에 전달하는 공개 정보)
export interface RoomInfo {
  id: string
  players: Player[]
  state: GameState
  currentTurn: number   // 0부터 시작
  totalTurns: number    // players.length와 동일
  turnTimeLimit: number // 초 단위
}

// ─── 소켓 이벤트 타입 ────────────────────────────────────────

// 클라이언트 → 서버
export interface ClientToServerEvents {
  'room:create': (payload: { name: string }, callback: (res: RoomCreateResponse) => void) => void
  'room:join': (payload: { roomId: string; name: string }, callback: (res: RoomJoinResponse) => void) => void
  'game:start': (callback: (res: BaseResponse) => void) => void
  'topic:submit': (payload: { topic: string }, callback: (res: BaseResponse) => void) => void
  'turn:submitDrawing': (payload: { imageData: string }, callback: (res: BaseResponse) => void) => void
  'turn:submitGuess': (payload: { guess: string }, callback: (res: BaseResponse) => void) => void
  'canvas:stroke': (payload: StrokePayload) => void
  'result:next': () => void  // 결과 다음 체인으로
}

// 서버 → 클라이언트
export interface ServerToClientEvents {
  'room:updated': (room: RoomInfo) => void
  'game:started': (room: RoomInfo) => void
  'topic:phase': (payload: { timeLimit: number }) => void
  'turn:start': (payload: TurnStartPayload) => void
  'turn:submitted': (payload: { playerId: string }) => void  // 누군가 제출함
  'canvas:stroke': (payload: StrokePayload) => void          // 다른 사람 드로잉 스트림
  'game:result': (payload: { chains: Chain[] }) => void
  'result:show': (payload: { index: number }) => void
  'error': (message: string) => void
}

// ─── 페이로드 타입 ───────────────────────────────────────────

export interface TurnStartPayload {
  turnIndex: number       // 몇 번째 턴
  stepType: StepType      // 'text' | 'drawing'
  content: string         // 이전 단계 내용 (보여줄 것)
  contentType: StepType   // content의 타입
  timeLimit: number
}

export interface StrokePayload {
  points: { x: number; y: number; pressure?: number }[]
  color: string
  size: number
  isEraser: boolean
}

// ─── 응답 타입 ───────────────────────────────────────────────

export interface BaseResponse {
  success: boolean
  error?: string
}

export interface RoomCreateResponse extends BaseResponse {
  roomId?: string
  player?: Player
}

export interface RoomJoinResponse extends BaseResponse {
  room?: RoomInfo
  player?: Player
}
