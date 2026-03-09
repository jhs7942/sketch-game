---
description: '기능 구현 전 요구사항과 기술 계획을 문서화합니다'
allowed-tools:
  [
    'Read',
    'Write',
    'Edit',
    'Glob',
  ]
---

# Claude 명령어: Plan

기능 구현 전 요구사항(require.md)과 기술 계획(plan.md)을 단계별로 작성합니다.

## 사용법

```
/plan 실시간 채팅 기능 추가
/plan 그림판 브러시 크기 조절
```

## 프로세스

1. 요구사항을 비기술적 언어로 `.claude/plans/require.md`에 정리
2. plan.md 생성 여부를 사용자에게 확인
3. 필요 시 기술 계획을 `.claude/plans/plan.md`에 정리
4. 구현 진행 여부를 사용자에게 확인

## require.md 포맷

```markdown
# 요구사항: {기능명}

## 목적
## 사용자 시나리오
## 기능 목록
## 제외 범위
## 완료 기준
```

## plan.md 포맷

```markdown
# 기술 계획: {기능명}

## 영향 범위 (파일/컴포넌트)
## 상태 관리 설계
## API / 소켓 이벤트
## 의존성 추가 여부
## 구현 순서
## 테스트 계획
```

## 규칙

- require.md는 비기술적으로, plan.md는 기술적으로 작성
- 구현 전 반드시 사용자 확인 필요
- 기존 require.md/plan.md가 있으면 덮어쓰기 전 확인
