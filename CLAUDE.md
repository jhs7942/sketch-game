# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 개발 명령어

```bash
# 전체 실행 (클라이언트 + 서버 동시)
npm run dev

# 개별 실행
npm run dev -w server   # ts-node-dev, 포트 3001
npm run dev -w client   # Vite, 포트 5173

# 빌드
npm run build           # shared → client → server 순서로 빌드
npm run build -w shared
npm run build -w client
npm run build -w server
```

## 아키텍처

**모노레포** (npm workspaces): `client` / `server` / `shared` 3개 패키지.

### shared (`@sketch-game/shared`)
`shared/src/index.ts` 하나에 모든 공용 타입·이벤트 인터페이스가 정의됨.
- `ClientToServerEvents` / `ServerToClientEvents` — Socket.io 이벤트 타입
- `GameState`, `Chain`, `Step`, `Player`, `RoomInfo` — 핵심 도메인 타입
- client·server 모두 이 패키지를 `@sketch-game/shared`로 import

### server (`@sketch-game/server`)
Express + Socket.io, **인메모리 상태**만 사용 (DB 없음).

- `src/index.ts` — Socket.io 이벤트 핸들러 전부 + 타이머 관리
- `src/game/gameManager.ts` — 순수 함수들로 구성된 방 상태 머신

게임 상태 흐름: `WAITING → TOPIC_INPUT → PLAYING → RESULT`

핵심 개념:
- 방은 `Map<roomId, Room>` 인메모리 저장
- `playerRoomMap: Map<socketId, roomId>` 로 플레이어 ↔ 방 추적
- 타이머는 서버가 관리 (`roomTimers: Map<roomId, setTimeout>`)
- 턴마다 체인을 오른쪽으로 순환: `chainIndex = (playerIndex - (currentTurn - 1)) % n`
- 홀수 턴 = 그림 그리기(`drawing`), 짝수 턴 = 추측(`text`)
- 시간 제한: 주제 30초 / 그림 90초 / 추측 40초

### client (`@sketch-game/client`)
Vite + React + TypeScript. 라우터 없음, `App.tsx`에서 상태로 화면 분기.

- `src/App.tsx` — `resultChains`, `roomInfo.state`, `currentTurnData.stepType`으로 페이지 전환
- `src/store/gameStore.ts` — Zustand 단일 스토어 (방·턴·결과·타이머 상태)
- `src/socket/socket.ts` — `autoConnect: false`로 생성, 로그인 시 수동 연결
- `src/socket/useSocketEvents.ts` — 서버 이벤트 수신 후 Zustand store 업데이트
- `src/components/canvas/DrawingCanvas.tsx` — `perfect-freehand` 기반 캔버스

환경변수:
```
# client/.env
VITE_SERVER_URL=http://localhost:3001   # 미설정 시 localhost:3001

# server/.env
PORT=3001
CLIENT_ORIGIN=http://localhost:5173     # CORS 허용 출처
```

## 주요 패턴

**소켓 이벤트 추가 시** — `shared/src/index.ts`의 `ClientToServerEvents` 또는 `ServerToClientEvents`에 타입 먼저 추가 → server `index.ts` �핸들러 → client `useSocketEvents.ts` 순서로 작업.

**캔버스 스트리밍** — 드로잉 중 `canvas:stroke` 이벤트로 스트로크 포인트 실시간 브로드캐스트, 제출 시에만 `canvas.toDataURL('image/webp', 0.8)`로 압축 후 전송.

**배포**: 클라이언트 → Vercel, 서버 → Railway (WebSocket 영구 연결 필요).
