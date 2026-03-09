---
description: '에러 로그나 증상을 분석해 원인을 파악하고 fix 파일을 생성합니다'
allowed-tools:
  [
    'Read',
    'Edit',
    'Grep',
    'Glob',
    'Write',
    'Glob',
    'mcp__ide__getDiagnostics',
  ]
---

# Claude 명령어: Debug

에러 로그 또는 증상을 받아 원인을 분석하고, 해결 후 `.claude/fix/` 파일을 생성합니다.

## 사용법

```
/debug
/debug TypeError: Cannot read properties of undefined
```

## 프로세스

1. 에러 메시지 또는 증상 입력받기
2. 관련 파일 탐색 및 원인 분석
3. 해결책 제안 후 사용자 확인
4. 수정 적용
5. `.claude/fix/{문제-이름}.md` 파일 자동 생성

## fix 파일 포맷

```markdown
# {문제 제목}

## 발생 환경
- 날짜: YYYY-MM-DD / 관련 파일: / 라이브러리·버전:

## 증상

## 원인

## 해결책

## 재발 방지
```

## 규칙

- 원인 파악 없이 증상만 제거하는 패치 금지
- 수정 범위를 최소화 (관련 없는 코드 변경 금지)
- 해결 후 반드시 fix 파일 생성
