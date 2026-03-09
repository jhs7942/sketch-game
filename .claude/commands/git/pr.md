---
description: '현재 브랜치의 변경사항을 분석해 PR 설명을 작성하고 GitHub에 생성합니다'
allowed-tools:
  [
    'Bash(git diff:*)',
    'Bash(git log:*)',
    'Bash(git status:*)',
    'Bash(git branch:*)',
    'mcp__github__create_pull_request',
    'mcp__github__list_pull_requests',
  ]
---

# Claude 명령어: PR

현재 브랜치의 변경사항을 분석해 PR 설명을 자동 작성하고 GitHub에 PR을 생성합니다.

## 사용법

```
/pr
```

## 프로세스

1. 현재 브랜치와 main 브랜치 간 diff 분석
2. 커밋 히스토리 요약
3. PR 제목 및 설명 초안 작성
4. 사용자 확인 후 GitHub PR 생성

## PR 포맷

```
## 변경 사항
- 주요 변경 내용을 bullet point로 작성

## 관련 이슈
- closes #이슈번호 (있는 경우)

## 테스트
- 테스트 방법 및 결과

## 스크린샷 (선택)
```

## 규칙

- PR 제목은 커밋 컨벤션과 동일한 포맷 사용
- base 브랜치는 기본적으로 main
- draft PR 여부를 사용자에게 확인
