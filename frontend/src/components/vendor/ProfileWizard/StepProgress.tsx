import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepProgressProps {
  currentStep: number
  totalSteps: number
  steps: string[]
}

export function StepProgress({ currentStep, totalSteps, steps }: StepProgressProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-between">
        {steps.map((step, idx) => (
          <div key={step} className="flex flex-col items-center flex-1">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              idx + 1 < currentStep ? "bg-green-500 text-white" :
              idx + 1 === currentStep ? "bg-[#0F4C5C] text-white" :
              "bg-gray-200 text-gray-500"
            )}>
              {idx + 1 < currentStep ? <Check className="w-4 h-4" /> : idx + 1}
            </div>
            <span className={cn(
              "text-xs mt-1",
              idx + 1 <= currentStep ? "text-[#0F4C5C]" : "text-gray-400"
            )}>{step}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 h-1 bg-gray-200 rounded">
        <div
          className="h-full bg-[#0F4C5C] rounded transition-all"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>
    </div>
  )
}
