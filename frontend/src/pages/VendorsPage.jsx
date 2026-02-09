import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useVendors } from "../hooks/useVendors";
import { useCategories } from "../hooks/useCategories";
import Navbar from "../components/Navbar";
import VendorCard from "../components/VendorCard";
import AIChat from "../components/AIChat";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Search, Loader2, Building2, UtensilsCrossed, Camera, Video, Flower2, Music, Grid3X3, Palette, Mic2, Scissors, Gift, Mail } from "lucide-react";

const categoryIcons = {
  venue: Building2,
  catering: UtensilsCrossed,
  photography: Camera,
  videography: Video,
  stage_decoration: Flower2,
  musicians: Music,
  nattuvanar: Mic2,
  makeup_artist: Palette,
  invitations: Mail,
  costumes: Scissors,
  return_gifts: Gift,
};

export default function VendorsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [chatOpen, setChatOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    search: searchParams.get("search") || "",
    price_range: searchParams.get("price") || "",
  });

  // Debounced search - only update filter when user stops typing
  const debouncedFilters = useMemo(() => ({
    category: filters.category,
    search: filters.search,
    price_range: filters.price_range,
  }), [filters.category, filters.search, filters.price_range]);

  const { data: vendors = [], isLoading: vendorsLoading } = useVendors(debouncedFilters);
  const { data: categories = [] } = useCategories();

  const handleCategoryChange = (category) => {
    const newCategory = category === "all" ? "" : category;
    setFilters({ ...filters, category: newCategory });
    if (newCategory) {
      searchParams.set("category", newCategory);
    } else {
      searchParams.delete("category");
    }
    setSearchParams(searchParams);
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      setFilters({ ...filters, search: searchInput });
    }
  };

  const handlePriceChange = (value) => {
    const newPrice = value === "all" ? "" : value;
    setFilters({ ...filters, price_range: newPrice });
  };

  const handleClearFilters = () => {
    setFilters({ category: "", search: "", price_range: "" });
    setSearchInput("");
    setSearchParams({});
  };

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
            Discover Bay Area's finest vendors for your Arangetram
          </p>
        </div>

        {/* Category Tabs */}
        <div className="mb-6 overflow-x-auto">
          <Tabs value={filters.category || "all"} onValueChange={handleCategoryChange}>
            <TabsList className="bg-white border border-[#E5E5E5] p-1 h-auto flex-wrap">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-[#0F4C5C] data-[state=active]:text-white rounded-lg px-4 py-2"
                data-testid="category-tab-all"
              >
                <Grid3X3 className="w-4 h-4 mr-2" />
                All
              </TabsTrigger>
              {categories.map((cat) => {
                const Icon = categoryIcons[cat.id] || Grid3X3;
                return (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className="data-[state=active]:bg-[#0F4C5C] data-[state=active]:text-white rounded-lg px-4 py-2"
                    data-testid={`category-tab-${cat.id}`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {cat.name}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#888888]" />
            <Input
              value={searchInput}
              onChange={handleSearchChange}
              onKeyDown={handleSearchSubmit}
              onBlur={handleSearchSubmit}
              placeholder="Search vendors..."
              className="!pl-10 input-styled"
              data-testid="vendor-search"
            />
          </div>
          <Select value={filters.price_range || "all"} onValueChange={handlePriceChange}>
            <SelectTrigger className="w-full sm:w-48 input-styled" data-testid="price-filter">
              <SelectValue placeholder="Price Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="$">$ - Budget</SelectItem>
              <SelectItem value="$$">$$ - Moderate</SelectItem>
              <SelectItem value="$$$">$$$ - Premium</SelectItem>
              <SelectItem value="$$$$">$$$$ - Luxury</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        {vendorsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#0F4C5C]" />
          </div>
        ) : vendors.length > 0 ? (
          <div className="bento-grid" data-testid="vendors-grid">
            {vendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-[#F9F8F4] flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-[#888888]" />
            </div>
            <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">No vendors found</h3>
            <p className="text-[#4A4A4A] mb-6">
              Try adjusting your filters or search terms
            </p>
            <Button onClick={handleClearFilters} className="btn-secondary">
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* AI Chat */}
      <AIChat isOpen={chatOpen} onClose={() => setChatOpen(!chatOpen)} />
    </div>
  );
}
