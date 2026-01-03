
"use client"

import { LoanConfiguration } from "@/components/LoanConfiguration"
import { LoanOverview } from "@/components/LoanOverview"
import { AmortizationSchedule } from "@/components/AmortizationSchedule"
import { useLoanConfigStore } from "@/store/loan-config-store"
import { useEffect, useRef } from "react"
import { MonitorPlay } from "lucide-react"
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"
import { testIndexedDB } from "@/lib/test-indexeddb"

export default function Home() {
  const { loadFromStorage } = useLoanConfigStore();
  const hasLoadedRef = useRef(false);

  // Initialize the store on mount (only once)
  useEffect(() => {
    if (!hasLoadedRef.current) {
      console.log("🚀 Initializing app - loading from IndexedDB...");

      // Test IndexedDB availability first
      testIndexedDB().then((result) => {
        if (result.available) {
          console.log("✅ IndexedDB is available and working");
        } else {
          console.error("❌ IndexedDB test failed:", result.error, result.details);
        }
      });

      loadFromStorage();
      hasLoadedRef.current = true;
    }
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

          {/* Right Column: Loan Overview and EMI Schedule (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            <LoanOverview />
            <AmortizationSchedule />
          </div>

        </div>
      </main>
    </ThemeProvider>
  )
}
