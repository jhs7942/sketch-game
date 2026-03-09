---
description: '프로젝트를 분석해 README.md를 자동 생성하거나 업데이트합니다'
allowed-tools:
  [
    'Read',
    'Write',
    'Edit',
    'Glob',
    'Grep',
    'Glob',
  ]
---

# Claude 명령어: Readme

프로젝트 구조와 코드를 분석해 README.md를 자동 생성하거나 업데이트합니다.

## 사용법

```
/readme
```

## 프로세스

1. `package.json`, 소스 코드, 폴더 구조 분석
2. README 초안 작성 후 사용자 확인
3. 루트 `README.md`에 저장

## README 포맷

```markdown
# 프로젝트명

> 한 줄 설명

## 기술 스택
## 시작하기
### 설치
### 실행
## 폴더 구조
## 주요 기능
## 환경 변수
## 배포
```

## 규칙

- 기술 스택은 실제 `package.json` 기반으로 작성
- 실행 명령어는 검증된 것만 포함
- 이미 README가 있으면 기존 내용을 보존하며 업데이트
- 배지(badge)는 GitHub Actions, npm 버전 등 실제 존재하는 것만
