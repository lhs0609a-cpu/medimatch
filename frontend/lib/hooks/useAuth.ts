'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '../api/client'
import { authService } from '../api/services'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    email: string
    password: string
    full_name: string
    phone?: string
    role: string
    company?: string
    license_number?: string
  }) => Promise<void>
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
  clearError: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const data = await authService.login(email, password)
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error: any) {
          set({
            error: error.response?.data?.detail || '로그인에 실패했습니다.',
            isLoading: false,
          })
          throw error
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null })
        try {
          await authService.register(data)
          // After registration, login automatically
          await get().login(data.email, data.password)
        } catch (error: any) {
          set({
            error: error.response?.data?.detail || '회원가입에 실패했습니다.',
            isLoading: false,
          })
          throw error
        }
      },

      logout: async () => {
        try {
          await authService.logout()
        } catch (error) {
          // Ignore errors during logout
        } finally {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          set({
            user: null,
            isAuthenticated: false,
          })
        }
      },

      fetchUser: async () => {
        const token = localStorage.getItem('access_token')
        if (!token) {
          set({ isAuthenticated: false, user: null })
          return
        }

        set({ isLoading: true })
        try {
          const user = await authService.getMe()
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
