import { useSocketEvents } from './socket/useSocketEvents'
import { useGameStore } from './store/gameStore'
import LobbyPage from './components/lobby/LobbyPage'
import WaitingRoom from './components/lobby/WaitingRoom'
import TopicInputPage from './components/game/TopicInputPage'
import DrawingTurn from './components/game/DrawingTurn'
import GuessTurn from './components/game/GuessTurn'
import ResultPage from './components/result/ResultPage'

export default function App() {
  useSocketEvents()

  const { roomInfo, myPlayer, currentTurnData, resultChains } = useGameStore()

  // 결과 화면
  if (resultChains.length > 0) return <ResultPage />

  // 게임 중
  if (roomInfo?.state === 'PLAYING' && currentTurnData) {
    if (currentTurnData.stepType === 'drawing') return <DrawingTurn />
    return <GuessTurn />
  }

  // 주제 입력
  if (roomInfo?.state === 'TOPIC_INPUT') return <TopicInputPage />

  // 대기실
  if (myPlayer) return <WaitingRoom />

  // 로비
  return <LobbyPage />
}
