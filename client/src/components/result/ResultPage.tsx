import { useGameStore } from '../../store/gameStore'
import type { Step } from '@sketch-game/shared'

export default function ResultPage() {
  const { resultChains, resultIndex, setResultIndex } = useGameStore()

  if (resultChains.length === 0) return null

  const currentChain = resultChains[resultIndex]
  const isLast = resultIndex === resultChains.length - 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 flex flex-col items-center p-4 pt-6">
      <div className="w-full max-w-2xl">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black text-white drop-shadow">결과 공개!</h2>
          <p className="text-white/80 text-sm mt-1">
            {resultIndex + 1} / {resultChains.length}번째 이야기
          </p>
          {/* 인디케이터 */}
          <div className="flex justify-center gap-2 mt-3">
            {resultChains.map((_, i) => (
              <button
                key={i}
                onClick={() => setResultIndex(i)}
                className={`w-3 h-3 rounded-full transition-all ${i === resultIndex ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'}`}
              />
            ))}
          </div>
        </div>

        {/* 원래 주인 */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-4 text-center">
          <p className="text-gray-500 text-xs mb-1">원래 주제 (by {currentChain.ownerName})</p>
          <p className="text-2xl font-black text-gray-800">
            {currentChain.steps[0]?.content}
          </p>
        </div>

        {/* 체인 단계별 표시 */}
        <div className="space-y-3">
          {currentChain.steps.slice(1).map((step, i) => (
            <ChainStep key={i} step={step} index={i + 1} />
          ))}
        </div>

        {/* 최종 결과 */}
        {currentChain.steps.length > 1 && (
          <div className="mt-4 bg-white rounded-2xl shadow-lg p-4 text-center border-4 border-yellow-400">
            <p className="text-gray-500 text-xs mb-1">최종 답안</p>
            {currentChain.steps[currentChain.steps.length - 1].type === 'text' ? (
              <p className="text-2xl font-black text-purple-700">
                {currentChain.steps[currentChain.steps.length - 1].content}
              </p>
            ) : (
              <img
                src={currentChain.steps[currentChain.steps.length - 1].content}
                alt="최종 그림"
                className="w-full rounded-xl"
              />
            )}
          </div>
        )}

        {/* 네비게이션 */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setResultIndex(resultIndex - 1)}
            disabled={resultIndex === 0}
            className="flex-1 bg-white/30 hover:bg-white/50 disabled:opacity-30 text-white font-bold py-3 rounded-2xl transition-colors"
          >
            이전
          </button>
          <button
            onClick={() => setResultIndex(resultIndex + 1)}
            disabled={isLast}
            className="flex-1 bg-white hover:bg-white/90 disabled:opacity-30 text-orange-600 font-bold py-3 rounded-2xl transition-colors"
          >
            {isLast ? '끝!' : '다음'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ChainStep({ step, index }: { step: Step; index: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
        <span className="text-xs font-bold text-gray-400">#{index}</span>
        <span className="text-sm font-semibold text-gray-600">{step.authorName}</span>
        <span className="ml-auto text-xs text-gray-400">
          {step.type === 'drawing' ? '그림' : '추측'}
        </span>
      </div>
      {step.type === 'drawing' ? (
        <img src={step.content} alt={`${step.authorName}의 그림`} className="w-full" />
      ) : (
        <div className="px-4 py-4 text-center">
          <p className="text-xl font-bold text-gray-800">{step.content}</p>
        </div>
      )}
    </div>
  )
}
