import { useState, useEffect } from "react";
import { useVendors } from "../hooks/useVendors";
import { useDiscoveryFilters } from "../hooks/useDiscoveryFilters";
import Navbar from "../components/Navbar";
import AIChat from "../components/AIChat";
import { FilterSidebar, MobileFilters } from "../components/discovery/FilterSidebar";
import { VendorGrid } from "../components/discovery/VendorGrid";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../components/ui/sheet";
import { Search, SlidersHorizontal } from "lucide-react";

export default function VendorsPage() {
  const [chatOpen, setChatOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const { filters, setFilter, clearFilters, hasActiveFilters } = useDiscoveryFilters();

  // Sync search input with URL param on mount
  useEffect(() => {
    if (filters.search && !searchInput) {
      setSearchInput(filters.search);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Map filters to useVendors params
  const vendorParams = {
    category: filters.category || undefined,
    search: filters.search || undefined,
    price_range: filters.priceRange || undefined,
    location: filters.location || undefined,
    availableDate: filters.availableDate || undefined,
  };

  const { data: vendors = [], isLoading: vendorsLoading } = useVendors(vendorParams);

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      setFilter('search', searchInput);
    }
  };

  const handleSearchBlur = () => {
    if (searchInput !== filters.search) {
      setFilter('search', searchInput);
    }
  };

  // Count active filters for badge
  const activeFilterCount = [
    filters.category,
    filters.location,
    filters.priceRange,
    filters.availableDate,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#F9F8F4]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-[#1A1A1A] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            Browse Vendors
          </h1>
          <p className="text-[#4A4A4A]">
            Discover the finest vendors for your Arangetram
          </p>
        </div>

        <div className="flex gap-6">
          {/* Left Sidebar - hidden on mobile, sticky on desktop */}
          <aside className="w-64 shrink-0 hidden lg:block">
            <FilterSidebar
              filters={filters}
              setFilter={setFilter}
              clearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Search bar + Mobile filter button */}
            <div className="flex gap-3 mb-6">
              {/* Mobile Filters Button */}
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="lg:hidden shrink-0 input-styled relative"
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#0F4C5C] text-white text-xs rounded-full flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="sr-only">Filters</SheetTitle>
                  </SheetHeader>
                  <MobileFilters
                    filters={filters}
                    setFilter={setFilter}
                    clearFilters={clearFilters}
                    hasActiveFilters={hasActiveFilters}
                  />
                  <div className="pt-4 border-t mt-6">
                    <Button
                      onClick={() => setMobileFiltersOpen(false)}
                      className="w-full btn-primary"
                    >
                      Show {vendors.length} Results
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#888888]" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleSearchSubmit}
                  onBlur={handleSearchBlur}
                  placeholder="Search vendors by name..."
                  className="!pl-10 input-styled"
                  data-testid="vendor-search"
                />
              </div>
            </div>

            {/* Results count */}
            {!vendorsLoading && (
              <p className="text-sm text-[#4A4A4A] mb-4">
                {vendors.length} {vendors.length === 1 ? 'vendor' : 'vendors'} found
                {hasActiveFilters && ' matching your filters'}
              </p>
            )}

            {/* Vendor Grid */}
            <VendorGrid
              vendors={vendors}
              isLoading={vendorsLoading}
              onClearFilters={clearFilters}
            />
          </main>
        </div>
      </div>

      {/* AI Chat */}
      <AIChat isOpen={chatOpen} onClose={() => setChatOpen(!chatOpen)} />
    </div>
  );
}
