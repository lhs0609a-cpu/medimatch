# MediMatch Platform

의료 개원 통합 솔루션 - 의사, 약사, 영업사원, 부동산을 연결하는 데이터 기반 플랫폼

## 플랫폼 구성

| 모듈 | 타겟 고객 | 수익 모델 |
|------|----------|----------|
| PharmMatch | 약사 | 매칭 수수료 (권리금 3~5%) |
| SalesScanner | 제약사/의료기기 영업 | 월 구독료 (ID당 3~5만원) |
| OpenSim | 개원 예정 의사 | 리포트 건당 3만원 |

## 기술 스택

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL + PostGIS + Redis + Elasticsearch
- **Infrastructure**: Docker, AWS

## 빠른 시작

### 사전 요구사항

- Docker & Docker Compose
- Node.js 20+
- Python 3.11+

### 설치 및 실행

1. 저장소 클론
```bash
cd medimatch
```

2. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일에 필요한 API 키 입력
```

3. Docker로 실행
```bash
cd infra/docker
docker-compose up -d
```

4. 개별 실행 (개발 모드)

**Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

### 접속 URL

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API 문서: http://localhost:8000/docs

## 프로젝트 구조

```
medimatch/
├── frontend/                # Next.js 프론트엔드
│   ├── app/                 # App Router 페이지
│   ├── components/          # React 컴포넌트
│   └── lib/                 # API 클라이언트, hooks
│
├── backend/                 # FastAPI 백엔드
│   ├── app/
│   │   ├── api/v1/         # API 엔드포인트
│   │   ├── core/           # 설정, 보안
│   │   ├── models/         # SQLAlchemy 모델
│   │   ├── schemas/        # Pydantic 스키마
│   │   └── services/       # 비즈니스 로직
│   └── alembic/            # DB 마이그레이션
│
├── infra/
│   └── docker/             # Docker 설정
│
└── .env.example            # 환경 변수 예시
```

## API 엔드포인트

### OpenSim (개원 시뮬레이터)
- `POST /api/v1/simulate` - 시뮬레이션 실행
- `GET /api/v1/simulate/{id}` - 결과 조회
- `GET /api/v1/simulate/{id}/competitors` - 경쟁 병원 상세

### SalesScanner (영업사원 B2B)
- `GET /api/v1/prospects` - 잠재 개원지 목록
- `GET /api/v1/prospects/map` - 지도 기반 조회 (GeoJSON)
- `GET /api/v1/prospects/{id}/report` - AI 영업 리포트
- `POST /api/v1/alerts` - 알림 설정
- `GET /api/v1/export/excel` - Excel 내보내기

### PharmMatch (약국 매칭)
- `GET /api/v1/slots` - 약국 자리 목록
- `POST /api/v1/slots` - 자리 등록 (관리자)
- `POST /api/v1/slots/{id}/bids` - 입찰 참여
- `PATCH /api/v1/bids/{id}/accept` - 입찰 수락

## 환경 변수

`.env.example` 파일을 참고하여 `.env` 파일을 생성하고 필요한 API 키를 입력하세요.

### 필수 API 키
- 심평원 API (병원 정보)
- 국토교통부 API (건축물대장)
- 소상공인진흥공단 API (상권정보)
- 카카오맵 API (지도)

## 라이선스

Private - 플라톤마케팅 × 부공연 협업 프로젝트

---

© 2025 MediMatch. All rights reserved.
