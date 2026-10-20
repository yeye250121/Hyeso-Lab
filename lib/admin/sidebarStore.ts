'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 사이드바 접힘 상태. 콘솔 레이아웃(본문 여백)과 사이드바가 같이 본다.
interface SidebarState {
  collapsed: boolean
  toggle: () => void
  setCollapsed: (v: boolean) => void
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      toggle: () => set((s) => ({ collapsed: !s.collapsed })),
      setCollapsed: (v) => set({ collapsed: v }),
    }),
    { name: 'admin-sidebar' }
  )
)

export const SIDEBAR_WIDTH = 224
