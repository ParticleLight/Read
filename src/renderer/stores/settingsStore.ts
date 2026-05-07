import { create } from 'zustand'

export interface SettingsState {
  theme: 'light' | 'dark' | 'sepia'
  fontSize: number
  fontFamily: string
  lineHeight: number
  margin: number
  textAlign: 'left' | 'justify'

  // null = using global settings, number = per-book mode
  activeBookId: number | null

  setTheme: (theme: 'light' | 'dark' | 'sepia') => void
  setFontSize: (size: number) => void
  setFontFamily: (family: string) => void
  setLineHeight: (height: number) => void
  setMargin: (margin: number) => void
  setTextAlign: (align: 'left' | 'justify') => void
  saveSettings: () => void
  loadSettings: () => Promise<void>
  loadBookSettings: (bookId: number) => Promise<void>
  clearBookSettings: () => void
}

const SETTINGS_KEYS = ['theme', 'fontSize', 'fontFamily', 'lineHeight', 'margin', 'textAlign'] as const

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: 'dark',
  fontSize: 18,
  fontFamily: 'Georgia, Noto Serif SC, serif',
  lineHeight: 1.8,
  margin: 40,
  textAlign: 'justify',
  activeBookId: null,

  setTheme: (theme) => {
    set({ theme })
    get().saveSettings()
  },
  setFontSize: (fontSize) => {
    set({ fontSize })
    get().saveSettings()
  },
  setFontFamily: (fontFamily) => {
    set({ fontFamily })
    get().saveSettings()
  },
  setLineHeight: (lineHeight) => {
    set({ lineHeight })
    get().saveSettings()
  },
  setMargin: (margin) => {
    set({ margin })
    get().saveSettings()
  },
  setTextAlign: (textAlign) => {
    set({ textAlign })
    get().saveSettings()
  },

  saveSettings: () => {
    const { activeBookId, theme, fontSize, fontFamily, lineHeight, margin, textAlign } = get()
    const settings = { theme, fontSize, fontFamily, lineHeight, margin, textAlign }
    if (activeBookId !== null) {
      // Save to per-book settings
      window.electronAPI.updateBookSettings(activeBookId, settings)
    } else {
      // Save to global settings
      window.electronAPI.updateSettings(settings)
    }
  },

  loadSettings: async () => {
    try {
      const settings = await window.electronAPI.getSettings()
      if (settings.theme) set({ theme: settings.theme })
      if (settings.fontSize) set({ fontSize: settings.fontSize })
      if (settings.fontFamily) set({ fontFamily: settings.fontFamily })
      if (settings.lineHeight) set({ lineHeight: settings.lineHeight })
      if (settings.margin) set({ margin: settings.margin })
      if (settings.textAlign) set({ textAlign: settings.textAlign })
    } catch (e) {
      console.error('Failed to load settings:', e)
    }
  },

  // Load per-book settings when opening a book
  loadBookSettings: async (bookId: number) => {
    try {
      // First load global settings as base
      const globalSettings = await window.electronAPI.getSettings()
      const baseSettings: Record<string, any> = {}
      for (const key of SETTINGS_KEYS) {
        if (globalSettings[key] !== undefined) baseSettings[key] = globalSettings[key]
      }

      // Then check for per-book overrides
      const bookSettings = await window.electronAPI.getBookSettings(bookId)
      if (bookSettings) {
        // Merge: book settings override global
        for (const key of SETTINGS_KEYS) {
          if (bookSettings[key] !== undefined) baseSettings[key] = bookSettings[key]
        }
      }

      set({
        ...baseSettings,
        activeBookId: bookId,
      })
    } catch (e) {
      console.error('Failed to load book settings:', e)
      set({ activeBookId: bookId })
    }
  },

  // Called when closing a book - revert to global settings
  clearBookSettings: () => {
    set({ activeBookId: null })
    get().loadSettings()
  },
}))
