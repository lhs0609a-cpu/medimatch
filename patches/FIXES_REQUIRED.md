# MediMatch 프로젝트 수정 사항

## 구글 드라이브 동기화 문제로 인해 직접 파일 수정이 어려워 수정 가이드를 제공합니다.

---

## 1. CRITICAL: 결제 웹훅 서명 검증 추가

**파일**: `backend/app/api/v1/payments.py`

**@router.post("/webhook")** 함수 앞에 다음 함수를 추가:

```python
def verify_webhook_signature(payload: bytes, signature: str, secret_key: str) -> bool:
    """토스페이먼츠 웹훅 서명 검증"""
    import hmac
    import hashlib
    import base64

    expected_signature = base64.b64encode(
        hmac.new(
            secret_key.encode('utf-8'),
            payload,
            hashlib.sha256
        ).digest()
    ).decode('utf-8')

    return hmac.compare_digest(signature, expected_signature)
```

**payment_webhook 함수 수정**:

```python
@router.post("/webhook")
async def payment_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """토스페이먼츠 웹훅 처리"""
    import os
    import json
    import logging

    logger = logging.getLogger(__name__)

    # 서명 검증
    signature = request.headers.get("Toss-Signature", "")
    secret_key = os.getenv("TOSS_SECRET_KEY", "")

    payload = await request.body()

    if signature and secret_key:
        if not verify_webhook_signature(payload, signature, secret_key):
            logger.warning("Invalid webhook signature received")
            return {"status": "error", "message": "Invalid signature"}

    try:
        body = json.loads(payload)
        # ... 나머지 코드는 동일
```

---

## 2. CRITICAL: SQL 인젝션 취약점 수정

**파일**: `backend/app/api/v1/prospect.py`

**수정 1**: 파일 상단에 추가:
```python
import json

# 정렬 컬럼 화이트리스트 (SQL 인젝션 방지)
ALLOWED_SORT_COLUMNS = {"prospect_score", "years_operated", "monthly_revenue"}
```

**수정 2**: `get_prospects` 함수에서 `where_sql = ...` 이후에 추가:
```python
# 정렬 컬럼 화이트리스트 검증 (SQL 인젝션 방지)
if sort_by not in ALLOWED_SORT_COLUMNS:
    sort_by = "prospect_score"
order_dir = "DESC" if sort_order == "desc" else "ASC"
```

**수정 3**: Pydantic V2 호환성 - `regex` -> `pattern` 변경:
```python
# 변경 전
status: str = Field(..., regex="^(not_contacted|...)$")

# 변경 후
status: str = Field(..., pattern="^(not_contacted|...)$")
```

---

## 3. HIGH: WebSocket 버그 수정

**파일**: `backend/app/api/v1/websocket.py`

**수정 1**: import 수정 (Line 12):
```python
# 변경 전
from app.core.security import decode_access_token

# 변경 후
from app.core.security import verify_token
```

**수정 2**: verify_token 함수 수정 (Line 101-116):
```python
async def verify_token_ws(token: str) -> Optional[User]:
    """JWT 토큰 검증 및 사용자 조회"""
    from app.core.database import async_session

    try:
        payload = verify_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return None

        async with async_session() as db:
            result = await db.execute(
                select(User).where(User.id == user_id)
            )
            return result.scalar_one_or_none()
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        return None
```

**수정 3**: `AsyncSessionLocal` -> `async_session` 변경 (모든 곳):
```python
# 변경 전
from app.core.database import AsyncSessionLocal
async with AsyncSessionLocal() as db:

# 변경 후
from app.core.database import async_session
async with async_session() as db:
```

---

## 4. HIGH: SECRET_KEY 검증 추가

**파일**: `backend/app/core/config.py`

**Settings 클래스에 validator 추가**:
```python
from pydantic import field_validator

class Settings(BaseSettings):
    # ... 기존 필드들 ...

    @field_validator('SECRET_KEY')
    @classmethod
    def validate_secret_key(cls, v):
        if v == "your-super-secret-key-change-in-production":
            import warnings
            warnings.warn("Using default SECRET_KEY! Set a secure key in production.")
        return v
```

---

## 5. HIGH: OAuth state 검증 추가

**파일**: `backend/app/api/v1/oauth.py`

**Redis 기반 state 저장 추가** (간단한 메모리 캐시로 대체 가능):

```python
import time

# 간단한 메모리 기반 state 저장소 (프로덕션에서는 Redis 사용)
_oauth_states = {}

def save_oauth_state(state: str, ttl: int = 600):
    """OAuth state 저장"""
    _oauth_states[state] = time.time() + ttl

def verify_oauth_state(state: str) -> bool:
    """OAuth state 검증"""
    if state not in _oauth_states:
        return False
    if time.time() > _oauth_states[state]:
        del _oauth_states[state]
        return False
    del _oauth_states[state]
    return True
```

**각 콜백 함수에서 state 검증 추가**:
```python
@router.post("/google/callback", response_model=OAuthTokenResponse)
async def google_callback(data: OAuthCallbackRequest, ...):
    # state 검증 추가
    if data.state and not verify_oauth_state(data.state):
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    # ... 나머지 코드
```

---

## 6. 프론트엔드 Mock 데이터 교체

다음 파일들에서 Mock 데이터를 실제 API 호출로 교체해야 합니다:

| 파일 | 현재 상태 |
|------|----------|
| `frontend/app/partners/page.tsx` | Mock categories/partners 데이터 |
| `frontend/app/partners/[id]/page.tsx` | Mock 파트너 상세 데이터 |
| `frontend/app/chat/page.tsx` | Mock 채팅 목록 |
| `frontend/app/chat/[roomId]/page.tsx` | Mock 채팅 메시지 |
| `frontend/app/notifications/page.tsx` | Mock 알림 데이터 |
| `frontend/app/admin/settings/page.tsx` | setTimeout 가짜 저장 |
| `frontend/app/admin/stats/page.tsx` | API 연동 안됨 |

---

## 7. 접근성 개선

**파일**: `frontend/app/admin/settings/page.tsx`

Toggle 컴포넌트에 접근성 속성 추가:
```tsx
<button
  role="switch"
  aria-checked={value}
  aria-label={label}
  onClick={() => onChange(!value)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(!value);
    }
  }}
  className={`...`}
>
```

---

## 적용 순서

1. 백엔드 보안 수정 (1-5번)
2. 프론트엔드 Mock 데이터 교체 (6번)
3. 접근성/디자인 개선 (7번)
4. 테스트 및 빌드 확인
