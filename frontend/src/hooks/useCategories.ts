import { useQuery } from '@tanstack/react-query'

// Categories are defined in the database schema
// These match the CHECK constraint in vendor_profiles.category
export interface Category {
  id: string
  name: string
}

const CATEGORIES: Category[] = [
  { id: 'venue', name: 'Venues' },
  { id: 'catering', name: 'Catering' },
  { id: 'photography', name: 'Photography' },
  { id: 'videography', name: 'Videography' },
  { id: 'stage_decoration', name: 'Stage Decoration' },
  { id: 'musicians', name: 'Musicians' },
  { id: 'nattuvanar', name: 'Nattuvanar' },
  { id: 'makeup_artist', name: 'Makeup Artist' },
  { id: 'invitations', name: 'Invitations' },
  { id: 'costumes', name: 'Costumes' },
  { id: 'return_gifts', name: 'Return Gifts' },
]

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      // Categories are static, defined by database schema
      return CATEGORIES
    },
    staleTime: Infinity, // Never refetch - categories don't change
  })
}

export function getCategoryName(categoryId: string): string {
  const category = CATEGORIES.find(c => c.id === categoryId)
  return category?.name || categoryId
}
