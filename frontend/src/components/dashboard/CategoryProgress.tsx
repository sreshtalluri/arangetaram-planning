import { Link } from 'react-router-dom'
import { Check, Circle } from 'lucide-react'
import { getCategoryByValue } from '../../lib/vendor-categories'

interface CategoryProgressProps {
  needed: string[]       // categories_needed array
  covered: string[]      // categories_covered array
  compact?: boolean      // true for inline text, false for detailed view
  eventDate?: string     // optional event date for filtering vendors
}

/**
 * Visual progress indicator for category coverage
 * - compact=true: Simple "4/7 categories covered" text
 * - compact=false: Progress ring + category breakdown with clickable pending categories
 */
export function CategoryProgress({
  needed,
  covered,
  compact = false,
  eventDate,
}: CategoryProgressProps) {
  const total = needed.length
  const coveredCount = covered.length
  const percentage = total > 0 ? Math.round((coveredCount / total) * 100) : 0
  const circumference = 2 * Math.PI * 45 // radius = 45
  const offset = circumference - (percentage / 100) * circumference

  // Derive pending categories (needed but not covered)
  const pending = needed.filter((cat) => !covered.includes(cat))

  if (compact) {
    return (
      <span className="text-sm text-[#4A4A4A]">
        {coveredCount}/{total} categories covered
      </span>
    )
  }

  return (
    <div className="flex items-start gap-6">
      {/* Progress Ring */}
      <div className="relative inline-flex items-center justify-center shrink-0">
        <svg className="w-24 h-24 transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="48"
            cy="48"
            r="45"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx="48"
            cy="48"
            r="45"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-[#0F4C5C] transition-all duration-500"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-bold text-[#1A1A1A]">
            {coveredCount}/{total}
          </span>
          <span className="text-xs text-[#888888]">categories</span>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="flex-1 space-y-1.5">
        {needed.map((categoryValue) => {
          const isCovered = covered.includes(categoryValue)
          const category = getCategoryByValue(categoryValue)
          const label = category?.label || categoryValue

          if (isCovered) {
            return (
              <div
                key={categoryValue}
                className="flex items-center gap-2 text-sm"
              >
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-[#4A4A4A]">{label}</span>
              </div>
            )
          }

          // Pending category - clickable link to browse vendors
          const searchParams = new URLSearchParams({ category: categoryValue })
          if (eventDate) {
            searchParams.set('date', eventDate)
          }

          return (
            <Link
              key={categoryValue}
              to={`/vendors?${searchParams.toString()}`}
              className="flex items-center gap-2 text-sm group"
            >
              <Circle className="w-4 h-4 text-[#888888] group-hover:text-[#0F4C5C]" />
              <span className="text-[#888888] group-hover:text-[#0F4C5C] group-hover:underline">
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default CategoryProgress
