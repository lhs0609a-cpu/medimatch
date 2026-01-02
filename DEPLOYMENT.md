# MediMatch 배포 가이드

## GitHub Secrets 설정

GitHub Repository > Settings > Secrets and variables > Actions에서 다음 Secrets를 설정하세요.

### 필수 Secrets

| Secret Name | Description | 발급 방법 |
|-------------|-------------|-----------|
| `FLY_API_TOKEN` | Fly.io API 토큰 | `fly auth token` 실행 |
| `VERCEL_TOKEN` | Vercel API 토큰 | Vercel Dashboard > Settings > Tokens |
| `VERCEL_ORG_ID` | Vercel Organization ID | `.vercel/project.json` 참조 |
| `VERCEL_PROJECT_ID` | Vercel Project ID | `.vercel/project.json` 참조 |

### 선택 Secrets (Codecov 등)

| Secret Name | Description |
|-------------|-------------|
| `CODECOV_TOKEN` | Codecov 업로드 토큰 |

## Fly.io 배포

### 초기 설정

```bash
# Fly CLI 설치
curl -L https://fly.io/install.sh | sh

# 로그인
fly auth login

# 앱 생성 (이미 생성됨)
cd backend
fly apps create medimatch-api

# PostgreSQL 데이터베이스 생성
fly postgres create --name medimatch-db

# DB 연결
fly postgres attach medimatch-db --app medimatch-api

# Secrets 설정
fly secrets set SECRET_KEY="your-secret-key" --app medimatch-api
fly secrets set JWT_SECRET_KEY="your-jwt-secret" --app medimatch-api
fly secrets set TOSS_SECRET_KEY="your-toss-secret" --app medimatch-api
```

### 수동 배포

```bash
cd backend
fly deploy
```

### 배포 확인

```bash
fly status --app medimatch-api
fly logs --app medimatch-api
```

## Vercel 배포

### 초기 설정

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 연결
cd frontend
vercel link

# 환경변수 설정 (Vercel Dashboard에서도 가능)
vercel env add NEXT_PUBLIC_API_URL
vercel env add NEXT_PUBLIC_KAKAO_MAP_KEY
vercel env add NEXT_PUBLIC_TOSS_CLIENT_KEY
```

### 수동 배포

```bash
cd frontend

# Preview 배포
vercel

# Production 배포
vercel --prod
```

## CI/CD 파이프라인

### 자동 배포 트리거

- **main 브랜치 push**: 자동으로 Production 배포
- **PR 생성**: CI 테스트만 실행
- **수동 실행**: GitHub Actions > workflow_dispatch

### 워크플로우 파일

| 파일 | 설명 |
|------|------|
| `.github/workflows/ci.yml` | CI (테스트, 린트, 보안 스캔) |
| `.github/workflows/deploy-backend.yml` | Backend 배포 (Fly.io) |
| `.github/workflows/deploy-frontend.yml` | Frontend 배포 (Vercel) |

## 환경별 설정

### Development

```bash
# Backend
cd backend
cp .env.example .env
# .env 파일 수정 (로컬 설정)
uvicorn app.main:app --reload

# Frontend
cd frontend
cp .env.example .env.local
# .env.local 파일 수정
npm run dev
```

### Production

#### Backend (Fly.io)
- `fly.toml` 설정 사용
- Secrets는 `fly secrets set`으로 관리
- PostgreSQL은 Fly Postgres 사용

#### Frontend (Vercel)
- Vercel Dashboard에서 환경변수 관리
- 자동 HTTPS, CDN 적용

## 모니터링

### 로그 확인

```bash
# Backend 로그
fly logs --app medimatch-api -t

# Frontend 로그
# Vercel Dashboard > Functions > Logs
```

### 헬스 체크

- Backend: https://api.medimatch.kr/health
- Frontend: https://medimatch.kr

## 롤백

### Backend (Fly.io)

```bash
# 이전 버전 목록 확인
fly releases --app medimatch-api

# 특정 버전으로 롤백
fly deploy --image registry.fly.io/medimatch-api:v123
```

### Frontend (Vercel)

Vercel Dashboard > Deployments에서 이전 배포 선택 후 "Promote to Production"

## 트러블슈팅

### Backend 배포 실패

1. `fly logs` 확인
2. Database 연결 확인: `fly postgres connect --app medimatch-db`
3. Secrets 확인: `fly secrets list --app medimatch-api`

### Frontend 빌드 실패

1. `npm run build` 로컬에서 테스트
2. TypeScript 에러 확인: `npx tsc --noEmit`
3. 환경변수 확인 (NEXT_PUBLIC_ 접두사)
