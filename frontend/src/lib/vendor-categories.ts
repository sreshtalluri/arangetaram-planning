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

// Booking defaults per vendor category
export interface CategoryBookingDefaults {
  booking_type: 'exclusive' | 'multi'
  max_per_day: number
  buffer_days_before: number
  buffer_days_after: number
  buffer_label_before?: string
  buffer_label_after?: string
}

export const CATEGORY_BOOKING_DEFAULTS: Record<string, CategoryBookingDefaults> = {
  venue: {
    booking_type: 'exclusive',
    max_per_day: 1,
    buffer_days_before: 1,
    buffer_days_after: 1,
    buffer_label_before: 'Setup day',
    buffer_label_after: 'Teardown day',
  },
  catering: {
    booking_type: 'multi',
    max_per_day: 2,
    buffer_days_before: 0,
    buffer_days_after: 0,
  },
  photography: {
    booking_type: 'exclusive',
    max_per_day: 1,
    buffer_days_before: 0,
    buffer_days_after: 0,
  },
  videography: {
    booking_type: 'exclusive',
    max_per_day: 1,
    buffer_days_before: 0,
    buffer_days_after: 0,
  },
  stage_decoration: {
    booking_type: 'exclusive',
    max_per_day: 1,
    buffer_days_before: 1,
    buffer_days_after: 0,
    buffer_label_before: 'Setup day',
  },
  musicians: {
    booking_type: 'exclusive',
    max_per_day: 1,
    buffer_days_before: 5,
    buffer_days_after: 0,
    buffer_label_before: 'Rehearsal days',
  },
  nattuvanar: {
    booking_type: 'exclusive',
    max_per_day: 1,
    buffer_days_before: 5,
    buffer_days_after: 0,
    buffer_label_before: 'Rehearsal days',
  },
  makeup_artist: {
    booking_type: 'exclusive',
    max_per_day: 1,
    buffer_days_before: 0,
    buffer_days_after: 0,
  },
  invitations: {
    booking_type: 'multi',
    max_per_day: 3,
    buffer_days_before: 0,
    buffer_days_after: 0,
  },
  costumes: {
    booking_type: 'multi',
    max_per_day: 3,
    buffer_days_before: 0,
    buffer_days_after: 0,
  },
  return_gifts: {
    booking_type: 'multi',
    max_per_day: 3,
    buffer_days_before: 0,
    buffer_days_after: 0,
  },
}
