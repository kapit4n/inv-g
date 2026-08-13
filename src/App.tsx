import { useEffect } from "react"
import { RouterProvider } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { router } from "@/routes"
import { queryClient } from "@/lib/query-client"
import { useAuthStore, useAppSettingsStore } from "@/stores"
import { ErrorBoundary } from "@/components/error-boundary"
import { NotificationCenter } from "@/components/notification-center"
import { DialogHost } from "@/components/dialog-host"

export default function App() {
  const initialize = useAuthStore((s) => s.initialize)
  const hydrate = useAppSettingsStore((s) => s.hydrate)

  useEffect(() => {
    initialize()
    hydrate()
  }, [initialize, hydrate])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <RouterProvider router={router} />
          <NotificationCenter />
          <DialogHost />
        </ErrorBoundary>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
