import { create } from 'zustand'
import type { Chain, Player, RoomInfo, TurnStartPayload } from '@sketch-game/shared'

interface GameStore {
  // 방 정보
  roomInfo: RoomInfo | null
  myPlayer: Player | null

  // 현재 턴 정보
  currentTurnData: TurnStartPayload | null

  // 결과
  resultChains: Chain[]
  resultIndex: number  // 현재 보여주는 체인 인덱스

  // 타이머
  timeLeft: number
  timerInterval: ReturnType<typeof setInterval> | null

  // 액션
  setRoomInfo: (room: RoomInfo) => void
  setMyPlayer: (player: Player) => void
  setCurrentTurnData: (data: TurnStartPayload) => void
  setResultChains: (chains: Chain[]) => void
  setResultIndex: (index: number) => void
  startTimer: (seconds: number) => void
  stopTimer: () => void
  reset: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  roomInfo: null,
  myPlayer: null,
  currentTurnData: null,
  resultChains: [],
  resultIndex: 0,
  timeLeft: 0,
  timerInterval: null,

  setRoomInfo: (room) => set({ roomInfo: room }),
  setMyPlayer: (player) => set({ myPlayer: player }),
  setCurrentTurnData: (data) => set({ currentTurnData: data }),
  setResultChains: (chains) => set({ resultChains: chains }),
  setResultIndex: (index) => set({ resultIndex: index }),

  startTimer: (seconds) => {
    const { timerInterval } = get()
    if (timerInterval) clearInterval(timerInterval)

    set({ timeLeft: seconds })

    const interval = setInterval(() => {
      const { timeLeft } = get()
      if (timeLeft <= 1) {
        clearInterval(interval)
        set({ timeLeft: 0, timerInterval: null })
      } else {
        set({ timeLeft: timeLeft - 1 })
      }
    }, 1000)

    set({ timerInterval: interval })
  },

  stopTimer: () => {
    const { timerInterval } = get()
    if (timerInterval) clearInterval(timerInterval)
    set({ timerInterval: null, timeLeft: 0 })
  },

  reset: () => {
    const { timerInterval } = get()
    if (timerInterval) clearInterval(timerInterval)
    set({
      roomInfo: null,
      myPlayer: null,
      currentTurnData: null,
      resultChains: [],
      resultIndex: 0,
      timeLeft: 0,
      timerInterval: null,
    })
  },
}))
