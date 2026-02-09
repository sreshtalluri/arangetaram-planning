import VendorCard from '../VendorCard'
import { Search } from 'lucide-react'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'

function LoadingSkeleton() {
  return (
    <div className="bento-grid">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
          <Skeleton className="w-full h-48" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ onClearFilters }) {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 rounded-full bg-[#F9F8F4] flex items-center justify-center mx-auto mb-4">
        <Search className="w-10 h-10 text-[#888888]" />
      </div>
      <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">No vendors found</h3>
      <p className="text-[#4A4A4A] mb-6">
        Try adjusting your filters or search terms
      </p>
      {onClearFilters && (
        <Button onClick={onClearFilters} className="btn-secondary">
          Clear Filters
        </Button>
      )}
    </div>
  )
}

export function VendorGrid({ vendors, isLoading, onClearFilters }) {
  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (vendors.length === 0) {
    return <EmptyState onClearFilters={onClearFilters} />
  }

  return (
    <div className="bento-grid" data-testid="vendors-grid">
      {vendors.map((vendor) => (
        <VendorCard key={vendor.id} vendor={vendor} />
      ))}
    </div>
  )
}
