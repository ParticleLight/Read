import { create } from 'zustand'

export interface SettingsState {
  theme: 'light' | 'dark' | 'sepia'
  fontSize: number
  fontFamily: string
  lineHeight: number
  margin: number
  textAlign: 'left' | 'justify'

  setTheme: (theme: 'light' | 'dark' | 'sepia') => void
  setFontSize: (size: number) => void
  setFontFamily: (family: string) => void
  setLineHeight: (height: number) => void
  setMargin: (margin: number) => void
  setTextAlign: (align: 'left' | 'justify') => void
  saveSettings: () => void
  loadSettings: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: 'dark',
  fontSize: 18,
  fontFamily: 'Georgia, Noto Serif SC, serif',
  lineHeight: 1.8,
  margin: 40,
  textAlign: 'justify',

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
    const { theme, fontSize, fontFamily, lineHeight, margin, textAlign } = get()
    window.electronAPI.updateSettings({
      theme, fontSize, fontFamily, lineHeight, margin, textAlign
    })
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
}))
