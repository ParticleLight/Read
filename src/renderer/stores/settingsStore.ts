import { create } from 'zustand'

export interface SettingsState {
  theme: 'light' | 'dark' | 'sepia'
  fontSize: number
  fontFamily: string
  lineHeight: number
  margin: number
  textAlign: 'left' | 'justify'

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
      window.electronAPI.updateBookSettings(activeBookId, settings).catch((e) => {
        console.error('Failed to save book settings:', e)
      })
    } else {
      window.electronAPI.updateSettings(settings).catch((e) => {
        console.error('Failed to save settings:', e)
      })
    }
  },

  loadSettings: async () => {
    try {
      const settings = await window.electronAPI.getSettings()
      if (settings.theme !== undefined) set({ theme: settings.theme })
      if (settings.fontSize !== undefined) set({ fontSize: settings.fontSize })
      if (settings.fontFamily !== undefined) set({ fontFamily: settings.fontFamily })
      if (settings.lineHeight !== undefined) set({ lineHeight: settings.lineHeight })
      if (settings.margin !== undefined) set({ margin: settings.margin })
      if (settings.textAlign !== undefined) set({ textAlign: settings.textAlign })
    } catch (e) {
      console.error('Failed to load settings:', e)
    }
  },

  loadBookSettings: async (bookId: number) => {
    try {
      const globalSettings = await window.electronAPI.getSettings()
      const baseSettings: Record<string, any> = {}
      for (const key of SETTINGS_KEYS) {
        if (globalSettings[key] !== undefined) baseSettings[key] = globalSettings[key]
      }

      const bookSettings = await window.electronAPI.getBookSettings(bookId)
      if (bookSettings) {
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

  clearBookSettings: () => {
    set({ activeBookId: null })
    get().loadSettings()
  },
}))
