import { create } from "zustand"
import { persist } from "zustand/middleware"
import i18n from "i18next"

interface LanguageStore {
  language: string
  setLanguage: (language: string) => void
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: "es",
      setLanguage: (language: string) => {
        set({ language })
        i18n.changeLanguage(language)
      },
    }),
    {
      name: "inventory-gear-language",
    }
  )
)
