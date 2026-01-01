"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  showTooltip = false,
  formatTooltip = (v: number) => v.toString(),
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
  showTooltip?: boolean
  formatTooltip?: (value: number) => string
}) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min], // Fixed: should be [min] or similar if no value, but usually [0]
    [value, defaultValue, min]
  )

  const valuesToDisplay = value || defaultValue || [min]

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5"
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
          )}
        />
      </SliderPrimitive.Track>
      {valuesToDisplay.map((val, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className="group border-primary ring-ring/50 relative block size-4 shrink-0 rounded-full border bg-white shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
        >
          {showTooltip && (
            <div className="bg-primary text-primary-foreground absolute -top-10 left-1/2 -translate-x-1/2 rounded px-2.5 py-1.5 text-xs font-bold shadow-lg opacity-0 transition-all duration-200 group-hover:opacity-100 group-focus:opacity-100 group-active:opacity-100 group-active:scale-110 pointer-events-none whitespace-nowrap z-50">
              {formatTooltip(val)}
              <div className="bg-primary absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45" />
            </div>
          )}
        </SliderPrimitive.Thumb>
      ))}

    </SliderPrimitive.Root>
  )
}


export { Slider }
