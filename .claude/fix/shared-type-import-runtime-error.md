# shared 타입 import 런타임 오류

## 발생 환경
- 날짜: 2026-03-07
- 관련 파일: client/src/socket/socket.ts, client/src/store/gameStore.ts, client/src/components/canvas/DrawingCanvas.tsx, client/src/components/result/ResultPage.tsx
- 라이브러리·버전: Vite 7.3.1, socket.io-client 4.7.4, TypeScript 5.9.3

## 증상
브라우저 콘솔에서 페이지 로드 시 즉시 에러 발생:
```
The requested module '/@fs/.../shared/src/index.ts' does not provide an export named 'ClientToServerEvents'
```
앱이 완전히 렌더링되지 않고 흰 화면 출력.

## 원인
Vite는 내부적으로 esbuild를 사용해 TypeScript를 변환하며, `isolatedModules` 방식으로 동작합니다.
`interface`로 선언된 TypeScript 타입을 `import { InterfaceName }` 형태로 가져오면,
esbuild가 해당 import를 런타임 값 참조로 해석하려다 실패합니다.
`interface`는 런타임에 존재하지 않는 타입이기 때문에 브라우저에서 모듈 export를 찾지 못합니다.

## 해결책
타입 전용 import는 반드시 `import type` 구문을 사용합니다:

```typescript
// 변경 전 (런타임 에러 발생)
import { ClientToServerEvents, ServerToClientEvents } from '@sketch-game/shared'

// 변경 후 (정상)
import type { ClientToServerEvents, ServerToClientEvents } from '@sketch-game/shared'
```

수정 대상 파일:
- `socket.ts`: ClientToServerEvents, ServerToClientEvents
- `gameStore.ts`: Chain, Player, RoomInfo, TurnStartPayload
- `DrawingCanvas.tsx`: StrokePayload
- `ResultPage.tsx`: Step

## 재발 방지
- 공유 타입 패키지(shared)에서 `interface` 또는 `type`만 import할 때는 항상 `import type` 사용
- tsconfig에 `"verbatimModuleSyntax": true` 옵션 추가하면 타입 전용 import에 `import type`을 강제할 수 있음
