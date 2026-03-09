---
description: 'IDE 진단 오류(타입 에러, lint 경고 등)를 자동으로 수정합니다'
allowed-tools:
  [
    'Read',
    'Edit',
    'Grep',
    'Glob',
    'mcp__ide__getDiagnostics',
  ]
---

# Claude 명령어: Fix

IDE의 진단 오류(타입 에러, ESLint 경고 등)를 읽어 자동으로 수정합니다.

## 사용법

```
/fix                            # 전체 진단 오류 수정
/fix src/components/Canvas.tsx  # 특정 파일 오류 수정
```

## 프로세스

1. IDE 진단 결과 읽기
2. 오류 목록 및 영향 파악
3. 수정 계획 제시 후 사용자 확인
4. 파일별 수정 적용
5. 재진단으로 오류 해소 확인

## 오류 우선순위

1. `error` — TypeScript 타입 오류, 빌드 실패
2. `warning` — ESLint 경고, 잠재적 버그
3. `info` — 스타일 제안

## 규칙

- 오류 수정 시 주변 로직은 건드리지 않음
- `// @ts-ignore` 또는 `// eslint-disable` 주석으로 무시하는 방식 금지
- 여러 파일에 연쇄 영향이 있으면 함께 수정
