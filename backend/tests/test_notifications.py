"""
Notification API Tests
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.notification import UserDevice, UserNotification, NotificationPreference, DevicePlatform, NotificationType


class TestDeviceRegistration:
    """Test device registration endpoints."""

    @pytest.mark.asyncio
    async def test_register_device_success(self, client: AsyncClient, auth_headers: dict):
        """Test successful device registration."""
        response = await client.post(
            "/api/v1/notifications/devices",
            headers=auth_headers,
            json={
                "fcm_token": "test-fcm-token-12345",
                "platform": "WEB",
                "device_name": "Chrome on Windows",
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["platform"] == "WEB"
        assert data["device_name"] == "Chrome on Windows"
        assert data["is_active"] is True

    @pytest.mark.asyncio
    async def test_register_device_unauthenticated(self, client: AsyncClient):
        """Test device registration without auth fails."""
        response = await client.post(
            "/api/v1/notifications/devices",
            json={
                "fcm_token": "test-token",
                "platform": "WEB",
            }
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_devices(self, client: AsyncClient, auth_headers: dict):
        """Test getting device list."""
        # First register a device
        await client.post(
            "/api/v1/notifications/devices",
            headers=auth_headers,
            json={
                "fcm_token": "test-fcm-token-list",
                "platform": "WEB",
            }
        )

        # Get device list
        response = await client.get(
            "/api/v1/notifications/devices",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    @pytest.mark.asyncio
    async def test_unregister_device(self, client: AsyncClient, auth_headers: dict):
        """Test device unregistration."""
        # First register a device
        register_response = await client.post(
            "/api/v1/notifications/devices",
            headers=auth_headers,
            json={
                "fcm_token": "test-fcm-token-delete",
                "platform": "WEB",
            }
        )
        device_id = register_response.json()["id"]

        # Unregister the device
        response = await client.delete(
            f"/api/v1/notifications/devices/{device_id}",
            headers=auth_headers,
        )
        assert response.status_code == 200


class TestNotifications:
    """Test notification endpoints."""

    @pytest.mark.asyncio
    async def test_get_notifications_empty(self, client: AsyncClient, auth_headers: dict):
        """Test getting empty notification list."""
        response = await client.get(
            "/api/v1/notifications",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        assert "total" in data
        assert "unread_count" in data

    @pytest.mark.asyncio
    async def test_get_notifications_unauthenticated(self, client: AsyncClient):
        """Test getting notifications without auth fails."""
        response = await client.get("/api/v1/notifications")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_mark_all_as_read(self, client: AsyncClient, auth_headers: dict):
        """Test marking all notifications as read."""
        response = await client.post(
            "/api/v1/notifications/read-all",
            headers=auth_headers,
        )
        assert response.status_code == 200


class TestNotificationPreferences:
    """Test notification preference endpoints."""

    @pytest.mark.asyncio
    async def test_get_preferences(self, client: AsyncClient, auth_headers: dict):
        """Test getting notification preferences."""
        response = await client.get(
            "/api/v1/notifications/preferences",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "email_enabled" in data
        assert "push_enabled" in data
        assert "sms_enabled" in data
        assert "kakao_enabled" in data

    @pytest.mark.asyncio
    async def test_update_preferences(self, client: AsyncClient, auth_headers: dict):
        """Test updating notification preferences."""
        response = await client.put(
            "/api/v1/notifications/preferences",
            headers=auth_headers,
            json={
                "email_enabled": False,
                "push_enabled": True,
                "marketing": True,
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email_enabled"] is False
        assert data["push_enabled"] is True
        assert data["marketing"] is True

    @pytest.mark.asyncio
    async def test_send_test_notification(self, client: AsyncClient, auth_headers: dict):
        """Test sending test notification."""
        response = await client.post(
            "/api/v1/notifications/test",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "devices_count" in data
