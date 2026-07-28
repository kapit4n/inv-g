import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"
import { setupI18n } from "./i18n"
import { useLanguageStore } from "./stores"

const language = useLanguageStore.getState().language
setupI18n(language)

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
