import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/admin/api'

interface Admin {
  id: string
  loginId: string
  nickname: string
  uniqueCode: string
}

interface AuthState {
  admin: Admin | null
  setAdmin: (admin: Admin) => void
  logout: () => Promise<void>
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      admin: null,
      setAdmin: (admin) => set({ admin }),
      logout: async () => {
        try {
          await api.post('/admin/auth/logout')
        } catch (error) {
          console.error('Logout error:', error)
        }
        set({ admin: null })
      },
      isAuthenticated: () => {
        const state = get()
        return !!state.admin
      },
    }),
    {
      name: 'admin-auth-storage',
    }
  )
)
