import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    PHARMACIST = "PHARMACIST"
    SALES_REP = "SALES_REP"
    DOCTOR = "DOCTOR"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.DOCTOR, nullable=False)
    company = Column(String(200), nullable=True)  # For SALES_REP
    license_number = Column(String(50), nullable=True)  # For PHARMACIST/DOCTOR
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    bids = relationship("Bid", back_populates="pharmacist")
    alerts = relationship("UserAlert", back_populates="user")
    simulations = relationship("Simulation", back_populates="user")

    def __repr__(self):
        return f"<User {self.email}>"
