/**
 * Global application state using Zustand.
 * Manages theme, tone, and sidebar state.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set) => ({
      // Theme: 'light' | 'dark'
      theme: 'light',
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          document.documentElement.classList.toggle('dark', newTheme === 'dark');
          return { theme: newTheme };
        }),
      initTheme: () =>
        set((state) => {
          document.documentElement.classList.toggle('dark', state.theme === 'dark');
          return {};
        }),

      // Tone: 'professional' | 'casual' | 'concise'
      tone: 'professional',
      setTone: (tone) => set({ tone }),

      // Sidebar visibility (for mobile)
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'chat-app-settings',
      partialize: (state) => ({ theme: state.theme, tone: state.tone }),
    }
  )
);
