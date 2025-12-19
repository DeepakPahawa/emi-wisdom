
"use client"

import { InputForm } from "@/components/InputForm"
import { SummaryCards } from "@/components/SummaryCards"
import { AmortizationChart } from "@/components/AmortizationChart"
import { CalculationService } from "@/services/CalculationService"
import { LoanDetails, CalculationResult } from "@/types"
import { useState, useMemo } from "react"
// If heroicons not installed, use Lucide
import { MonitorPlay } from "lucide-react"

export default function Home() {
  const [details, setDetails] = useState<LoanDetails>({
    principal: 5000000,
    rate: 9,
    durationMonths: 240
  })

  // Use memo to recalculate only when inputs change
  const result: CalculationResult = useMemo(() => {
    return CalculationService.calculateAmortizationSchedule(details)
  }, [details])

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col items-center gap-8">
      {/* Header */}
      <header className="w-full max-w-7xl flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/30">
            <MonitorPlay className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            EMI Wisdom
          </h1>
        </div>
      </header>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Input Form (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <InputForm onDetailsChange={setDetails} />

          {/* Smart Insight Panel Placeholder - Can be separate component */}
          <div className="p-6 bg-emerald-900/20 border border-emerald-500/30 rounded-xl backdrop-blur-sm">
            <h3 className="text-emerald-400 font-medium mb-2">Smart Insight</h3>
            {result.crossingPointMonth ? (
              <p className="text-sm text-emerald-100/80">
                Your principal payment will exceed interest payment in <span className="text-white font-bold">Month {result.crossingPointMonth}</span> (Year {Math.ceil(result.crossingPointMonth / 12)}).
              </p>
            ) : (
              <p className="text-sm text-emerald-100/80">
                Interest component dominates for the entire tenure at this rate.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Dashboard (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          <SummaryCards result={result} />
          <AmortizationChart data={result.schedule} crossingPoint={result.crossingPointMonth} />
        </div>

      </div>
    </main>
  )
}
