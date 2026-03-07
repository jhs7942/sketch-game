import { useEffect } from 'react'
import { socket } from './socket'
import { useGameStore } from '../store/gameStore'

export function useSocketEvents() {
  const { setRoomInfo, setCurrentTurnData, setResultChains, startTimer, stopTimer } = useGameStore()

  useEffect(() => {
    socket.on('room:updated', room => {
      setRoomInfo(room)
    })

    socket.on('game:started', room => {
      setRoomInfo(room)
    })

    socket.on('topic:phase', ({ timeLimit }) => {
      startTimer(timeLimit)
    })

    socket.on('turn:start', payload => {
      setCurrentTurnData(payload)
      startTimer(payload.timeLimit)
    })

    socket.on('turn:submitted', () => {
      // 방 상태는 room:updated 이벤트로 처리
    })

    socket.on('game:result', ({ chains }) => {
      stopTimer()
      setResultChains(chains)
    })

    socket.on('error', msg => {
      console.error('[소켓 에러]', msg)
    })

    return () => {
      socket.off('room:updated')
      socket.off('game:started')
      socket.off('topic:phase')
      socket.off('turn:start')
      socket.off('turn:submitted')
      socket.off('game:result')
      socket.off('error')
    }
  }, [setRoomInfo, setCurrentTurnData, setResultChains, startTimer, stopTimer])
}
