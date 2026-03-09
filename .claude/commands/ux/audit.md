---
description: 사용자 관점에서 UX·디자인·기능 흐름을 평가하고 개선 사항을 리포트합니다
allowed-tools: Read, Glob, Grep, Bash, mcp__playwright__browser_navigate, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_snapshot, mcp__playwright__browser_resize, mcp__playwright__browser_console_messages
---

# UX 감사 (UX Audit)

스케치 게임의 모든 화면을 사용자 관점에서 평가합니다.

## 대상 화면
- **LobbyPage**: 방 생성/입장 (보라/분홍 그라디언트)
- **WaitingRoom**: 대기실 (플레이어 목록)
- **TopicInputPage**: 주제 입력
- **DrawingTurn**: 그림 그리기 (초록/청록 그라디언트)
- **GuessTurn**: 추측 입력
- **ResultPage**: 결과 공개 (노랑/주황 그라디언트)

---

## 1단계: 정적 분석 (항상 실행)

`client/src/` 아래 모든 컴포넌트 파일을 읽고 아래 항목을 평가하세요.

| 항목 | 체크 내용 |
|------|-----------|
| 디자인 일관성 | 색상/폰트/간격/컴포넌트 패턴 통일성 |
| 로딩·에러 상태 | 피드백 텍스트 존재 여부, disabled 처리 |
| 반응형 | Tailwind 반응형 클래스(sm/md/lg) 사용 여부 |
| 접근성(a11y) | 버튼 크기, label-input 연결, 키보드 접근 |
| 빈 상태 | 데이터 없을 때 처리 (null 반환 외 fallback) |

분석 대상 파일:
```
Glob: client/src/**/*.tsx
Read: 각 페이지 컴포넌트
Grep: className, disabled, aria-, placeholder, onChange
```

---

## 2단계: 브라우저 실사

### 서버 상태 확인 및 자동 실행

Bash로 `http://localhost:5173` 응답 여부를 먼저 확인하세요.

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 --max-time 2
```

- **200 응답** → 이미 실행 중. 바로 다음 단계로 이동.
- **실패 또는 비200** → 아래 명령으로 백그라운드에서 dev 서버를 자동 실행하세요.

```bash
cd /Users/jeonghyeonseung/workspaces/sketch_game && npm run dev &
```

서버 기동 후 준비될 때까지 최대 15초 대기:

```bash
for i in $(seq 1 15); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 --max-time 1)
  [ "$code" = "200" ] && echo "ready" && break
  sleep 1
done
```

준비 완료 메시지가 출력되면 이어서 실사를 진행합니다.

---

`http://localhost:5173`에 접속해 아래를 순서대로 수행하세요.

### 데스크톱 (1280×800)
1. `browser_resize` → 1280×800
2. LobbyPage 스크린샷 캡처
3. 콘솔 에러 수집 (`browser_console_messages`)
4. 스냅샷으로 인터랙티브 요소 구조 파악 (`browser_snapshot`)

### 모바일 (375×812)
1. `browser_resize` → 375×812
2. LobbyPage 스크린샷 캡처
3. 레이아웃 깨짐·터치 타겟 크기 확인

---

## 리포트 포맷

분석이 완료되면 아래 형식으로 출력하세요.

```
## UX 감사 리포트

### 종합 평가 (★★★★☆)
한 줄 요약

### 화면별 평가

#### LobbyPage
- 잘된 점:
- 개선 필요:

#### WaitingRoom
- 잘된 점:
- 개선 필요:

#### TopicInputPage
- 잘된 점:
- 개선 필요:

#### DrawingTurn
- 잘된 점:
- 개선 필요:

#### GuessTurn
- 잘된 점:
- 개선 필요:

#### ResultPage
- 잘된 점:
- 개선 필요:

### 우선 개선 항목
| 우선순위 | 화면 | 문제 | 제안 |
|----------|------|------|------|
| P0 | | | |
| P1 | | | |
| P2 | | | |
```
