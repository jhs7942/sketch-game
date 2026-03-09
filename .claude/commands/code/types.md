---
description: 'TypeScript 타입을 개선하고 any 사용을 제거합니다'
allowed-tools:
  [
    'Read',
    'Edit',
    'Grep',
    'Glob',
    'mcp__ide__getDiagnostics',
  ]
---

# Claude 명령어: Types

TypeScript `any` 사용을 제거하고 타입 안전성을 개선합니다.

## 사용법

```
/types                          # 전체 프로젝트 any 탐색
/types src/components/Canvas.tsx  # 특정 파일 타입 개선
```

## 프로세스

1. 대상 범위에서 `any` 사용 위치 탐색
2. 각 위치의 의도 파악 후 적절한 타입 추론
3. 변경 목록을 사용자에게 제시
4. 승인 후 일괄 적용

## 개선 기준

| 상황 | 대체 방법 |
|------|-----------|
| API 응답 | 인터페이스/타입 정의 |
| 이벤트 핸들러 | `React.ChangeEvent<T>` 등 활용 |
| 외부 라이브러리 | `@types/*` 설치 또는 `unknown` + 타입가드 |
| 동적 키 접근 | `Record<string, T>` 또는 인덱스 시그니처 |
| 제네릭 필요 | 제네릭 타입 파라미터 추가 |

## 규칙

- `any` → `unknown` 단순 교체 금지, 올바른 타입으로 추론
- shared 패키지의 공용 타입 최대 활용
- 타입 변경이 다른 파일에 영향을 주면 함께 수정
