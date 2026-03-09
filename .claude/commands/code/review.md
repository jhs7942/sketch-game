---
description: '변경된 코드의 품질·보안·성능을 리뷰하고 개선 사항을 제안합니다'
allowed-tools:
  [
    'Bash(git diff:*)',
    'Bash(git status:*)',
    'Read',
    'Grep',
    'Glob',
    'mcp__ide__getDiagnostics',
  ]
---

# Claude 명령어: Review

변경된 코드를 다각도로 리뷰하고 구체적인 개선 사항을 제안합니다.

## 사용법

```
/review
/review src/components/Canvas.tsx  # 특정 파일 리뷰
```

## 프로세스

1. 스테이지된 변경사항 또는 지정 파일 분석
2. 아래 관점으로 리뷰 수행
3. 심각도별로 분류하여 리포트 출력

## 리뷰 관점

| 관점 | 체크 항목 |
|------|-----------|
| **품질** | 가독성, 중복 코드, 불필요한 복잡도 |
| **보안** | XSS, SQL Injection, 민감정보 노출 |
| **성능** | 불필요한 렌더링, 메모리 누수, 무거운 연산 |
| **타입** | `any` 사용, 타입 누락, 잘못된 타입 |
| **규칙** | CLAUDE.md 코드 스타일 준수 여부 |

## 심각도

- `critical` — 즉시 수정 필요 (보안, 버그)
- `warning` — 수정 권장 (성능, 품질)
- `info` — 선택적 개선 (스타일, 가독성)
