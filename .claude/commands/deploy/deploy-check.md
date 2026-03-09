---
description: '배포 전 환경변수·빌드·타입·의존성을 점검하는 체크리스트를 실행합니다'
allowed-tools:
  [
    'Read',
    'Glob',
    'Grep',
    'Bash(npm run build:*)',
    'Bash(npx tsc --noEmit:*)',
    'Bash(git status:*)',
    'Bash(git log:*)',
    'mcp__ide__getDiagnostics',
  ]
---

# Claude 명령어: Deploy Check

배포 전 필수 항목을 점검하고 이상 여부를 리포트합니다.

## 사용법

```
/deploy-check
```

## 프로세스

1. 체크리스트 항목 순서대로 검사
2. 이상 항목 발견 시 즉시 보고 및 수정 여부 확인
3. 전체 결과 요약 출력

## 체크리스트

### 코드 상태
- [ ] 미커밋 변경사항 없음 (`git status`)
- [ ] 빌드 성공 (`npm run build`)
- [ ] TypeScript 타입 오류 없음
- [ ] IDE 진단 에러 없음

### 환경 설정
- [ ] `.env` 파일이 `.gitignore`에 포함됨
- [ ] 필수 환경변수 모두 정의됨 (`.env.example` 기준)
- [ ] 프로덕션용 환경변수와 개발용 분리됨

### 의존성
- [ ] `package.json`과 `package-lock.json` 동기화
- [ ] `devDependencies`가 `dependencies`에 혼재하지 않음

### 보안
- [ ] 소스 코드에 하드코딩된 시크릿 없음
- [ ] 콘솔 로그 디버그 출력 제거됨

## 규칙

- 빨간 항목(실패)이 있으면 배포 진행 금지 권고
- 수동 확인이 필요한 항목은 사용자에게 직접 질문
