"""
Authentication API Tests
"""
import pytest
from httpx import AsyncClient

from app.models.user import User, UserRole


class TestAuthRegistration:
    """Test user registration endpoints."""

    @pytest.mark.asyncio
    async def test_register_user_success(self, client: AsyncClient):
        """Test successful user registration."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "securepassword123",
                "full_name": "New User",
                "phone": "010-1111-2222",
                "role": "DOCTOR",
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["full_name"] == "New User"
        assert "id" in data

    @pytest.mark.asyncio
    async def test_register_user_duplicate_email(self, client: AsyncClient, test_user: User):
        """Test registration with existing email fails."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": test_user.email,
                "password": "anotherpassword123",
                "full_name": "Another User",
                "role": "DOCTOR",
            }
        )
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_register_user_invalid_email(self, client: AsyncClient):
        """Test registration with invalid email fails."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "invalid-email",
                "password": "securepassword123",
                "full_name": "Invalid User",
                "role": "DOCTOR",
            }
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_register_pharmacist_with_license(self, client: AsyncClient):
        """Test pharmacist registration with license number."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "pharmacist@test.com",
                "password": "pharmpass123",
                "full_name": "Test Pharmacist",
                "role": "PHARMACIST",
                "license_number": "PHARM-99999",
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "PHARMACIST"

    @pytest.mark.asyncio
    async def test_register_sales_rep_with_company(self, client: AsyncClient):
        """Test sales rep registration with company."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "salesrep@test.com",
                "password": "salespass123",
                "full_name": "Test Sales Rep",
                "role": "SALES_REP",
                "company": "Pharma Corp",
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "SALES_REP"


class TestAuthLogin:
    """Test user login endpoints."""

    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient, test_user: User):
        """Test successful login."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "testpassword123",
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient, test_user: User):
        """Test login with wrong password fails."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "wrongpassword",
            }
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Test login with nonexistent user fails."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "somepassword",
            }
        )
        assert response.status_code == 401


class TestAuthMe:
    """Test current user endpoints."""

    @pytest.mark.asyncio
    async def test_get_me_authenticated(self, client: AsyncClient, test_user: User, auth_headers: dict):
        """Test getting current user info when authenticated."""
        response = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["full_name"] == test_user.full_name

    @pytest.mark.asyncio
    async def test_get_me_unauthenticated(self, client: AsyncClient):
        """Test getting current user info when not authenticated."""
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_update_me(self, client: AsyncClient, test_user: User, auth_headers: dict):
        """Test updating current user info."""
        response = await client.put(
            "/api/v1/auth/me",
            headers=auth_headers,
            json={
                "full_name": "Updated Name",
                "phone": "010-9999-0000",
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == "Updated Name"
        assert data["phone"] == "010-9999-0000"


class TestAuthRefreshToken:
    """Test token refresh endpoints."""

    @pytest.mark.asyncio
    async def test_refresh_token_success(self, client: AsyncClient, test_user: User):
        """Test successful token refresh."""
        # First, login to get tokens
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "testpassword123",
            }
        )
        tokens = login_response.json()

        # Then refresh the token
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": tokens["refresh_token"]}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data

    @pytest.mark.asyncio
    async def test_refresh_token_invalid(self, client: AsyncClient):
        """Test refresh with invalid token fails."""
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid-token"}
        )
        assert response.status_code == 401
