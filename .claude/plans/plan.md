# 스케치 게임 기술 계획서

---

## 기술 스택

### 프론트엔드
| 항목 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | **Vite + React + TypeScript** | 게임 특성상 SEO 불필요, Next.js보다 가볍고 빠름 |
| 스타일링 | **Tailwind CSS** | 빠른 UI 개발 |
| 상태관리 | **Zustand** | 경량, 소켓 이벤트와 연동 용이 |
| 캔버스 | **HTML5 Canvas + perfect-freehand** | 부드러운 손그림 선 구현 라이브러리 |
| 소켓 클라이언트 | **socket.io-client** | 서버와 동일 라이브러리 사용 |

### 백엔드
| 항목 | 선택 | 이유 |
|------|------|------|
| 런타임 | **Node.js** | Socket.io와 가장 궁합 좋음 |
| 프레임워크 | **Express** | 경량, Socket.io 연동 표준 구성 |
| 실시간 통신 | **Socket.io** | 룸 관리, 재연결, 브로드캐스트 내장 |
| 게임 상태 | **In-memory (Map)** | DB 불필요, 게임은 일시적 데이터 |

> **DB 미사용 이유**: 게임 세션은 일시적이며 서버 재시작 시 초기화되어도 무관. Redis 등은 오버엔지니어링.

---

## 프로젝트 구조 (모노레포)

```
sketch_game/
├── client/                  # Vite + React
│   ├── src/
│   │   ├── components/
│   │   │   ├── canvas/      # 그림 캔버스, 도구 팔레트
│   │   │   ├── game/        # 게임 화면 (턴, 타이머, 체인 뷰어)
│   │   │   ├── lobby/       # 방 생성/입장, 대기실
│   │   │   └── result/      # 결과 공개 슬라이드
│   │   ├── store/           # Zustand 스토어
│   │   ├── socket/          # 소켓 이벤트 훅
│   │   └── types/           # 공통 타입 정의
│   └── vite.config.ts
│
├── server/                  # Node.js + Express + Socket.io
│   ├── src/
│   │   ├── rooms/           # 방 생성·입장·퇴장 로직
│   │   ├── game/            # 게임 상태 머신, 턴 관리
│   │   ├── timer/           # 서버사이드 타이머
│   │   └── index.ts         # 진입점
│   └── tsconfig.json
│
└── shared/                  # 클라이언트·서버 공통 타입
    └── types.ts
```

---

## 서버 설계

### 게임 상태 머신
```
WAITING → TOPIC_INPUT → PLAYING (턴 반복) → RESULT
```

| 상태 | 설명 |
|------|------|
| `WAITING` | 대기실, 플레이어 입장 대기 |
| `TOPIC_INPUT` | 각자 주제 입력 (30초 제한) |
| `PLAYING` | 턴 진행 (그림/추측 교대) |
| `RESULT` | 체인 결과 공개 |

### 핵심 데이터 구조
```typescript
// 서버 인메모리
Map<roomId, Room>

interface Room {
  id: string
  hostId: string
  players: Player[]
  state: GameState
  chains: Chain[]       // 각 플레이어의 주제 체인
  currentTurn: number   // 현재 몇 번째 턴인지
  timer: NodeJS.Timeout
}

interface Chain {
  ownerId: string
  steps: Step[]         // 주제→그림→추측→그림→... 순서대로 누적
}

interface Step {
  type: 'text' | 'drawing'
  content: string       // 텍스트 또는 base64 이미지
  authorId: string
}
```

### 소켓 이벤트 설계
```
[클라이언트 → 서버]
  room:create         방 생성 (닉네임)
  room:join           방 입장 (방코드, 닉네임)
  game:start          게임 시작 (호스트만)
  topic:submit        주제 제출
  turn:submitDrawing  그림 제출 (base64)
  turn:submitGuess    추측 텍스트 제출
  canvas:draw         캔버스 드로잉 스트림 (실시간)

[서버 → 클라이언트]
  room:updated        플레이어 목록 변경
  game:started        게임 시작 알림
  turn:start          새 턴 시작 (타입, 콘텐츠, 남은시간)
  turn:allSubmitted   모든 플레이어 제출 완료 → 다음 턴
  canvas:draw         다른 사람의 드로잉 스트림 수신
  game:result         최종 결과 데이터 전송
```

### 턴 흐름 로직
```
1. 모든 플레이어가 제출 OR 타이머 만료 → 다음 턴으로
2. 각 체인을 오른쪽으로 한 칸씩 이동 (player[i]의 체인 → player[i+1])
3. currentTurn === players.length → 게임 종료, RESULT로 전환
4. 타이머는 서버에서 관리 (클라이언트 조작 방지)
```

---

## 캔버스 도구 명세

### 도구 팔레트
| 도구 | 기능 |
|------|------|
| 펜 | 자유 곡선 드로잉 (perfect-freehand로 부드럽게) |
| 지우개 | 펜과 동일한 크기 조절, 배경색으로 덮어쓰기 방식 |
| 색상 선택 | 기본 12색 팔레트 + 커스텀 색상 피커 |
| 굵기 조절 | 슬라이더 (3px ~ 40px) |
| 전체 지우기 | 캔버스 초기화 (확인 없이 즉시) |
| 되돌리기(Undo) | 최근 스트로크 단위로 되돌리기 (최대 20단계) |

### 캔버스 실시간 동기화
- 드로잉 중 `canvas:draw` 이벤트로 스트로크 포인트 스트리밍
- 제출 시 `canvas.toDataURL('image/webp', 0.8)`로 압축 후 서버 전송
- 다른 플레이어는 실시간으로 캔버스를 구경 가능 (읽기 전용)

---

## 배포 설계

### 구성
```
[사용자 브라우저]
      ↕ HTTPS / WSS
[Vercel] ─── client (정적 빌드)
      ↕
[Railway] ─── server (Node.js + Socket.io)
```

| 서비스 | 플랫폼 | 이유 |
|--------|--------|------|
| 프론트엔드 | **Vercel** | 무료, CDN 자동, Vite 빌드 최적 |
| 백엔드 | **Railway** | WebSocket 영구 연결 지원, 무료 플랜 있음, 간단한 배포 |

> Vercel은 서버리스 함수 기반이라 **WebSocket 영구 연결 불가** → 백엔드는 반드시 별도 서버 필요

### 환경 변수
```
# client/.env
VITE_SERVER_URL=https://your-server.railway.app

# server/.env
PORT=3001
CLIENT_ORIGIN=https://your-app.vercel.app
```

### CORS 설정
```typescript
// server: Socket.io CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN,
    methods: ['GET', 'POST']
  }
})
```

---

## 개발 우선순위

1. 프로젝트 초기 세팅 (모노레포, TypeScript, 공통 타입)
2. 소켓 서버 + 방 생성/입장
3. 대기실 UI + 게임 시작
4. 주제 입력 → 턴 진행 로직 (서버)
5. 캔버스 컴포넌트 (그리기, 도구 팔레트)
6. 추측 입력 UI + 턴 전환
7. 상대방이 그린 그림을 보고 글자를 적어 답을 맞추기 + 턴 전환
8. 답을 보고 다시 그림을 그리기 + 턴 전환 (그림의 순서가 자기차래가 올 때 까지 반복)
9. 결과 공개 화면
10. 타이머, 예외처리 (플레이어 이탈 등)
11. 배포
