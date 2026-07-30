import type { ReactElement } from "react"
import { render as rtlRender, type RenderOptions } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

interface WrapperOptions {
  withRouter?: boolean
  withQuery?: boolean
  withTheme?: boolean
}

export function render(ui: ReactElement, options?: RenderOptions & WrapperOptions) {
  const { withRouter = true, withQuery = true, withTheme = false, ...renderOptions } = options ?? {}

  function Wrapper({ children }: { children: React.ReactNode }) {
    let wrapped = children
    if (withQuery) {
      const queryClient = createTestQueryClient()
      wrapped = <QueryClientProvider client={queryClient}>{wrapped}</QueryClientProvider>
    }
    if (withTheme) {
      wrapped = <ThemeProvider attribute="class" defaultTheme="light">{wrapped}</ThemeProvider>
    }
    if (withRouter) {
      wrapped = <BrowserRouter>{wrapped}</BrowserRouter>
    }
    return wrapped
  }

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions })
}

export { screen, waitFor, fireEvent, act } from "@testing-library/react"
export { userEvent } from "@testing-library/user-event"
