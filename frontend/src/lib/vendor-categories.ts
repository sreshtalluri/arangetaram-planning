export const VENDOR_CATEGORIES = [
  {
    value: 'venue',
    label: 'Venue',
    description: 'Temples, cultural centers, banquet halls for the ceremony',
    icon: 'Building2',
  },
  {
    value: 'catering',
    label: 'Catering',
    description: 'South Indian cuisine and traditional feast preparation',
    icon: 'UtensilsCrossed',
  },
  {
    value: 'photography',
    label: 'Photography',
    description: 'Professional photography for the dance debut',
    icon: 'Camera',
  },
  {
    value: 'videography',
    label: 'Videography',
    description: 'Video recording and highlights of the performance',
    icon: 'Video',
  },
  {
    value: 'stage_decoration',
    label: 'Stage Decoration',
    description: 'Traditional stage setup with flowers and drapery',
    icon: 'Palette',
  },
  {
    value: 'musicians',
    label: 'Musicians',
    description: 'Carnatic music accompaniment for the performance',
    icon: 'Music',
  },
  {
    value: 'nattuvanar',
    label: 'Nattuvanar',
    description: 'Dance conductor providing rhythmic recitation',
    icon: 'Mic2',
  },
  {
    value: 'makeup_artist',
    label: 'Makeup Artist',
    description: 'Traditional Bharatanatyam makeup and styling',
    icon: 'Sparkles',
  },
  {
    value: 'invitations',
    label: 'Invitations & Printing',
    description: 'Traditional invitation cards and event programs',
    icon: 'Mail',
  },
  {
    value: 'costumes',
    label: 'Costumes & Jewelry',
    description: 'Bharatanatyam costumes and temple jewelry rental',
    icon: 'Crown',
  },
  {
    value: 'return_gifts',
    label: 'Return Gifts',
    description: 'Traditional return gifts for guests',
    icon: 'Gift',
  },
] as const

export type VendorCategory = typeof VENDOR_CATEGORIES[number]['value']

export function getCategoryByValue(value: string) {
  return VENDOR_CATEGORIES.find(cat => cat.value === value)
}
