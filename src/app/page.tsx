
"use client"

import { InputForm } from "@/components/InputForm"
import { LoanSummary } from "@/components/LoanSummary"
import { AmortizationTable } from "@/components/AmortizationTable"
import { PAvsInterestCharts } from "@/components/PAvsInterestCharts"
import { useEmiStore } from "@/store/emi-store"
import { useEffect } from "react"
import { MonitorPlay } from "lucide-react"
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"

export default function Home() {
  const { recalculate } = useEmiStore();

  // Initialize the store on mount
  useEffect(() => {
    recalculate();
  }, [recalculate]);

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
          <ModeToggle />
        </header>

        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Loan Configuration + Loan Summary + Loan Details (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <InputForm />
          </div>

          {/* Right Column: Amortization Table + Charts (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            <AmortizationTable />
            <PAvsInterestCharts />
          </div>

        </div>
      </main>
    </ThemeProvider>
  )
}
