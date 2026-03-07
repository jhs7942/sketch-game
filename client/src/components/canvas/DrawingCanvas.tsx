import { useEffect, useRef, useState, useCallback } from 'react'
import { getStroke } from 'perfect-freehand'
import { socket } from '../../socket/socket'
import type { StrokePayload } from '@sketch-game/shared'

interface DrawingCanvasProps {
  readOnly?: boolean
  onExport?: (dataUrl: string) => void
}

interface StrokePoint { x: number; y: number; pressure: number }
interface Stroke { points: StrokePoint[]; color: string; size: number; isEraser: boolean }

const PALETTE_COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
  '#92400e', '#1e40af',
]

function getSvgPathFromStroke(points: number[][]): string {
  if (!points.length) return ''
  const d = points.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ['M', ...points[0], 'Q']
  )
  d.push('Z')
  return d.join(' ')
}

export default function DrawingCanvas({ readOnly = false, onExport }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [undoStack, setUndoStack] = useState<Stroke[][]>([[]])  // 상태 스냅샷 스택
  const [currentPoints, setCurrentPoints] = useState<StrokePoint[]>([])
  const [isDrawing, setIsDrawing] = useState(false)

  const [color, setColor] = useState('#000000')
  const [size, setSize] = useState(6)
  const [isEraser, setIsEraser] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)

  const activeColor = isEraser ? '#ffffff' : color

  // 캔버스 다시 그리기
  const redraw = useCallback((strokesToDraw: Stroke[], inProgressPoints?: StrokePoint[], inProgressColor?: string, inProgressSize?: number, inProgressEraser?: boolean) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const allStrokes = [...strokesToDraw]
    if (inProgressPoints && inProgressPoints.length > 0) {
      allStrokes.push({ points: inProgressPoints, color: inProgressColor || '#000000', size: inProgressSize || 6, isEraser: inProgressEraser || false })
    }

    allStrokes.forEach(stroke => {
      const outlinePoints = getStroke(stroke.points, {
        size: stroke.size,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
      })
      const path = getSvgPathFromStroke(outlinePoints)
      const p = new Path2D(path)
      ctx.fillStyle = stroke.isEraser ? '#ffffff' : stroke.color
      ctx.fill(p)
    })
  }, [])

  useEffect(() => {
    redraw(strokes)
  }, [strokes, redraw])

  // 외부 캔버스 스트로크 수신 (다른 플레이어)
  useEffect(() => {
    if (readOnly) {
      const handleRemoteStroke = (payload: StrokePayload) => {
        const newStroke: Stroke = {
          points: payload.points.map(p => ({ x: p.x, y: p.y, pressure: p.pressure || 0.5 })),
          color: payload.color,
          size: payload.size,
          isEraser: payload.isEraser,
        }
        setStrokes(prev => {
          const next = [...prev, newStroke]
          redraw(next)
          return next
        })
      }
      socket.on('canvas:stroke', handleRemoteStroke)
      return () => { socket.off('canvas:stroke', handleRemoteStroke) }
    }
  }, [readOnly, redraw])

  function getPos(e: React.PointerEvent<HTMLCanvasElement>): StrokePoint {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      pressure: e.pressure || 0.5,
    }
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (readOnly) return
    e.preventDefault()
    ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
    const pt = getPos(e)
    setIsDrawing(true)
    setCurrentPoints([pt])
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing || readOnly) return
    const pt = getPos(e)
    setCurrentPoints(prev => {
      const next = [...prev, pt]
      redraw(strokes, next, activeColor, size, isEraser)
      return next
    })
  }

  function onPointerUp() {
    if (!isDrawing || readOnly) return
    setIsDrawing(false)

    if (currentPoints.length === 0) return

    const newStroke: Stroke = { points: currentPoints, color: activeColor, size, isEraser }
    const nextStrokes = [...strokes, newStroke]
    setStrokes(nextStrokes)
    setUndoStack(prev => [...prev, nextStrokes])
    setCurrentPoints([])

    // 서버에 스트로크 전송
    socket.emit('canvas:stroke', {
      points: currentPoints.map(p => ({ x: p.x, y: p.y, pressure: p.pressure })),
      color: activeColor,
      size,
      isEraser,
    })
  }

  function handleUndo() {
    if (undoStack.length <= 1) {
      setStrokes([])
      redraw([])
      return
    }
    const newStack = undoStack.slice(0, -1)
    const prevStrokes = newStack[newStack.length - 1]
    setUndoStack(newStack)
    setStrokes(prevStrokes)
    redraw(prevStrokes)
  }

  function handleClear() {
    setStrokes([])
    setUndoStack([[]])
    setCurrentPoints([])
    redraw([])
  }

  function handleExport() {
    const canvas = canvasRef.current
    if (!canvas || !onExport) return
    onExport(canvas.toDataURL('image/webp', 0.85))
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* 도구 팔레트 */}
      {!readOnly && (
        <div className="bg-white rounded-2xl shadow p-3 flex flex-wrap items-center gap-3">
          {/* 펜 / 지우개 */}
          <div className="flex gap-1">
            <button
              onClick={() => setIsEraser(false)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${!isEraser ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              펜
            </button>
            <button
              onClick={() => setIsEraser(true)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${isEraser ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              지우개
            </button>
          </div>

          <div className="w-px h-6 bg-gray-200" />

          {/* 색상 팔레트 */}
          {!isEraser && (
            <div className="flex items-center gap-1 flex-wrap">
              {PALETTE_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c ? 'border-purple-500 scale-125' : 'border-gray-300'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              {/* 커스텀 색상 피커 */}
              <div className="relative">
                <button
                  onClick={() => setShowColorPicker(p => !p)}
                  className="w-6 h-6 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-xs text-gray-500 hover:border-purple-400"
                  title="커스텀 색상"
                >
                  +
                </button>
                {showColorPicker && (
                  <input
                    type="color"
                    value={color}
                    onChange={e => { setColor(e.target.value); setShowColorPicker(false) }}
                    className="absolute top-8 left-0 w-10 h-10 cursor-pointer"
                    autoFocus
                    onBlur={() => setShowColorPicker(false)}
                  />
                )}
              </div>
            </div>
          )}

          {/* 지우개 크기 미리보기 */}
          {isEraser && (
            <div className="flex items-center gap-2">
              <div
                className="rounded-full bg-gray-300 border border-gray-400"
                style={{ width: size, height: size }}
              />
            </div>
          )}

          <div className="w-px h-6 bg-gray-200" />

          {/* 굵기 슬라이더 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">굵기</span>
            <input
              type="range"
              min={2}
              max={40}
              value={size}
              onChange={e => setSize(Number(e.target.value))}
              className="w-20 accent-purple-600"
            />
            <span className="text-xs text-gray-500 w-6">{size}</span>
          </div>

          <div className="w-px h-6 bg-gray-200" />

          {/* Undo / 전체 지우기 */}
          <div className="flex gap-1 ml-auto">
            <button
              onClick={handleUndo}
              disabled={undoStack.length <= 1}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
            >
              되돌리기
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl text-sm font-semibold transition-colors"
            >
              전체 지우기
            </button>
          </div>
        </div>
      )}

      {/* 캔버스 */}
      <div ref={containerRef} className="relative w-full" style={{ aspectRatio: '4/3' }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          className="w-full h-full rounded-2xl shadow-inner bg-white border border-gray-200"
          style={{ cursor: readOnly ? 'default' : isEraser ? 'cell' : 'crosshair', touchAction: 'none' }}
        />
      </div>

      {/* 제출 버튼 */}
      {!readOnly && onExport && (
        <button
          onClick={handleExport}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-2xl text-lg transition-colors"
        >
          그림 제출하기
        </button>
      )}
    </div>
  )
}
