---
description: '현재 파일 또는 함수에 대한 유닛 테스트를 생성합니다'
allowed-tools:
  [
    'Read',
    'Write',
    'Edit',
    'Glob',
    'Grep',
  ]
---

# Claude 명령어: Test

지정한 파일 또는 함수의 유닛 테스트를 자동 생성합니다.

## 사용법

```
/test src/utils/gameLogic.ts
/test src/hooks/useSocket.ts connectSocket 함수
```

## 프로세스

1. 대상 파일 분석 (함수 시그니처, 엣지 케이스 파악)
2. 테스트 케이스 목록 제안
3. 사용자 확인 후 테스트 파일 생성

## 테스트 파일 위치

- `src/utils/foo.ts` → `src/utils/foo.test.ts`
- `src/hooks/useFoo.ts` → `src/hooks/useFoo.test.ts`

## 테스트 작성 기준

- 정상 케이스 (happy path)
- 엣지 케이스 (빈 값, 경계값, null/undefined)
- 오류 케이스 (예외 발생 시나리오)
- 비동기 함수는 async/await 패턴 사용

## 규칙

- 프레임워크: 프로젝트 설정에 따름. 미설정 시 Vitest 설치 여부를 사용자에게 먼저 확인
- 목(mock)은 최소화, 실제 동작 검증 우선
- 테스트 설명은 한국어로 작성
- `package.json`에 `test` 스크립트가 없으면 설치 및 스크립트 추가도 함께 제안
