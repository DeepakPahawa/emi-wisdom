
"use client"

import { LoanConfiguration } from "@/components/LoanConfiguration"
import { useLoanConfigStore } from "@/store/loan-config-store"
import { useEffect } from "react"
import { MonitorPlay } from "lucide-react"
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"

export default function Home() {
  const { loadFromStorage } = useLoanConfigStore();

  // Initialize the store on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <main className="min-h-screen p-4 md:p-8 flex flex-col items-center gap-8 transition-colors duration-300">
        {/* Header */}
        <header className="w-full max-w-7xl flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/90 rounded-lg shadow-lg shadow-primary/30">
              <MonitorPlay className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              EMI Hacks
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ModeToggle />
          </div>
        </header>

        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Loan Configuration (4 cols) */}
          <div className="lg:col-span-4 space-y-6" id="left-column-container">
            <LoanConfiguration />
          </div>

          {/* Right Column: Placeholder for future components (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
              <p className="text-lg">Loan Overview, Summary, and Charts will appear here</p>
            </div>
          </div>

        </div>
      </main>
    </ThemeProvider>
  )
}
