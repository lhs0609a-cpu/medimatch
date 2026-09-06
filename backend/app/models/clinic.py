"""
의료기관(테넌트) 모델 — 042

기존 EMR 데이터는 전부 users.id 에 직접 매달려 있어 "원장 1명 = 1병원"을 가정한다.
그 가정이 만드는 문제:
  - 간호사·데스크 직원이 같은 환자를 볼 수 없다 (StaffSeat은 소유자만 가리킬 뿐 접근 경로가 아니다)
  - 다지점이 불가능하다 (multi-branch 화면은 이미 있는데 데이터 모델이 없다)
  - 요양기관번호(ykiho)가 청구 모델에만 있고 기관이라는 개념 자체가 없다
  - 양수도·공동개원 시 데이터를 옮길 방법이 없다

Clinic 이 그 조직 단위이고, ClinicMember 가 사람과 기관을 잇는다.

이행 전략 (2단계):
  1단계(지금) — clinics/clinic_members 신설 + EMR 테이블에 nullable clinic_id 추가.
                기존 user_id 스코프 쿼리는 그대로 둔다. 아무것도 깨지지 않는다.
  2단계(다음) — 쿼리를 clinic_id 기준으로 전환하고 NOT NULL 로 조인다.

레코드 하나가 두 컬럼을 모두 갖는 기간이 있는데, 그 사이의 정합성은
backfill 이 users:clinics 를 1:1로 만들어 보장한다 (owner_user_id 유니크).
"""
import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Boolean, DateTime, ForeignKey, Index, Text,
    UniqueConstraint,
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


class ClinicRole(str, enum.Enum):
    """
    기관 내 역할.

    화면 구성이 이 값으로 갈린다 — 조사에서 확인된 바로는 같은 EMR을 두고
    의사는 사전심사(72%)를, 직원은 진료검색(43%)·예약관리(41%)를 1순위로 꼽는다.
    단일 IA로 두 직군을 만족시킨 제품은 없었다.
    """
    OWNER = "OWNER"        # 개설자 — 기관 삭제·양도 가능
    DOCTOR = "DOCTOR"      # 진료의
    NURSE = "NURSE"        # 간호(조무)사
    DESK = "DESK"          # 원무·데스크
    ACCOUNTANT = "ACCOUNTANT"  # 세무·회계 (경정청구 열람 전용)


class ClinicStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    CLOSED = "CLOSED"      # 폐업 — 진료기록 보존연한 때문에 삭제하지 않는다


class Clinic(Base):
    """의료기관 = 테넌트 경계"""
    __tablename__ = "clinics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # 개설자. 양도 시 바뀐다. 1단계 backfill 이 user 당 1개를 보장하므로 unique.
    owner_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        unique=True,
    )

    name = Column(String(200), nullable=False)

    # 요양기관기호 8자리 — 개설신고필증에 찍혀 나오고, 모든 청구의 기준값이다.
    # 개원 준비 단계에서는 아직 없으므로 nullable.
    ykiho = Column(String(8), nullable=True, unique=True)

    business_no = Column(String(12), nullable=True)   # 사업자등록번호
    primary_specialty = Column(String(40), nullable=True)
    phone = Column(String(20), nullable=True)
    address = Column(String(300), nullable=True)

    status = Column(
        SQLEnum(ClinicStatus, name="clinicstatus"),
        default=ClinicStatus.ACTIVE,
        nullable=False,
    )

    # 폐업일. 보존연한 계산의 기산점이다 (의료법 시행규칙 제15조).
    closed_at = Column(DateTime, nullable=True)

    # 진료과 토글 등 기관별 설정. 조사 결과 국내 표준 해법이
    # "범용 EMR + 병원설정 토글"이었다 (오름차트의 소아성장관리 사용유무 방식).
    settings = Column(JSONB, default=dict, nullable=False)

    memo = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", foreign_keys=[owner_user_id])
    members = relationship(
        "ClinicMember",
        back_populates="clinic",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_clinic_owner", "owner_user_id"),
        Index("ix_clinic_ykiho", "ykiho"),
        Index("ix_clinic_status", "status"),
    )


class ClinicMember(Base):
    """사람 × 기관 × 역할. 이것이 EMR 데이터 접근의 유일한 경로가 된다."""
    __tablename__ = "clinic_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    clinic_id = Column(
        UUID(as_uuid=True),
        ForeignKey("clinics.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    role = Column(
        SQLEnum(ClinicRole, name="clinicrole"),
        default=ClinicRole.DESK,
        nullable=False,
    )

    # 과금 좌석(StaffSeat)과의 연결. 좌석 없이도 멤버일 수 있어 nullable.
    seat_id = Column(
        UUID(as_uuid=True),
        ForeignKey("staff_seats.id", ondelete="SET NULL"),
        nullable=True,
    )

    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # 퇴사해도 행을 지우지 않는다. 접속기록·전자서명 이력이 이 멤버를 참조하고,
    # 의료법 제23조 제4항이 그 이력의 보관을 요구하기 때문이다.
    revoked_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    clinic = relationship("Clinic", back_populates="members")
    user = relationship("User", foreign_keys=[user_id])

    __table_args__ = (
        # 같은 사람이 같은 기관에 두 번 소속되지 않는다.
        # 재입사는 revoked_at 을 비우는 것으로 처리한다.
        UniqueConstraint("clinic_id", "user_id", name="ux_clinic_member"),
        Index("ix_clinic_member_clinic", "clinic_id"),
        Index("ix_clinic_member_user", "user_id"),
        Index("ix_clinic_member_active", "user_id", "revoked_at"),
    )

    @property
    def is_active(self) -> bool:
        return self.revoked_at is None
