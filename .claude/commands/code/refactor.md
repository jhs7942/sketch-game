---
description: '지정한 파일이나 함수를 분석해 리팩토링 계획을 제안하고 실행합니다'
allowed-tools:
  [
    'Read',
    'Edit',
    'Grep',
    'Glob',
    'mcp__ide__getDiagnostics',
  ]
---

# Claude 명령어: Refactor

지정한 파일 또는 함수를 분석해 리팩토링 계획을 제안하고, 확인 후 실행합니다.

## 사용법

```
/refactor src/components/Canvas.tsx
/refactor src/hooks/useSocket.ts drawLine 함수
```

## 프로세스

1. 대상 파일/함수 읽기 및 분석
2. 리팩토링 항목 목록화 및 사용자에게 제안
3. 사용자 승인 후 실행
4. 변경 전후 비교 요약

## 리팩토링 기준

- 중복 로직 추출 → 공통 훅/유틸로 분리
- 거대 컴포넌트 분해 → 단일 책임 원칙
- 매직 넘버/문자열 → 상수(UPPER_CASE)로 분리
- 복잡한 조건문 → 명시적 함수로 추출
- 불필요한 상태 제거 → 파생값으로 대체

## 규칙

- 동작 변경 없이 구조만 개선 (동작은 보존)
- 리팩토링 범위는 요청한 파일/함수에 한정
- 변경사항은 사용자 확인 후 적용
