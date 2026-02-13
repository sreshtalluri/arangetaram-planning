# Calendar UI Polish Design

**Date:** 2026-02-13
**Branch:** ui-updates
**Approach:** Polish existing react-day-picker with branded styling, improved interactions, and consistent theming across all date UIs.

## Scope

All calendar and date-related UIs:
1. Base `Calendar` component (`components/ui/calendar.jsx`)
2. Vendor `AvailabilityCalendar` (`components/vendor/AvailabilityCalendar.tsx`)
3. Event date picker (`components/event/EventWizard/StepDetails.tsx`)
4. Filter sidebar date picker (`components/discovery/FilterSidebar.jsx`)
5. Availability badge (`components/discovery/AvailabilityBadge.tsx`)

## Section 1: Base Calendar Component (calendar.jsx)

### Visual Theming

- Day cells: `h-10 w-10` (up from `h-8 w-8`) for premium feel
- Caption heading: **Playfair Display** serif for month/year
- Day-of-week headers: **Manrope** body font, muted `#888888`
- Navigation arrows: gold `#C5A059` hover states (not opacity toggle)
- Today indicator: Peacock Teal `#0F4C5C` ring (no fill)
- Selected state: Deep Crimson `#800020` fill with white text
- Disabled (past dates): very low opacity
- Hover state: Warm Parchment `#F9F8F4` bg with subtle scale
- Transitions: `transition-colors duration-200` on hover (never `transition-all`)

### Container

- `rounded-xl` with `border border-[#E5E5E5]`
- `p-5` padding
- Soft shadow: `0 4px 20px -2px rgba(0, 0, 0, 0.05)`

## Section 2: Vendor Availability Calendar (AvailabilityCalendar.tsx)

### Calendar States (Brand-Aligned)

- **Blocked/Booked:** Deep Crimson `#800020` at 15% opacity bg, crimson text
- **Selected-to-block:** Peacock Teal `#0F4C5C` at 15% opacity bg, teal text, `ring-2 ring-[#0F4C5C]`
- **Hover on available:** Warm Parchment `#F9F8F4` with gold border hint
- **Today:** Teal ring only (no fill conflict)

### Range Selection (New Interaction)

- Shift-click selects a continuous range: click date A, shift-click date B, all dates between selected
- Track last-clicked date, fill gap on shift+click
- No new library needed

### Legend Redesign

- Inline above the calendar as small pill badges (not sidebar section)
- Three states: Available (default), Booked (crimson pill), Selected (teal pill)
- Uses actual modifier colors

### Actions Panel Polish

- Background: `bg-[#F9F8F4]` (Warm Parchment) instead of `bg-gray-50`
- Border: `border-[#E5E5E5]`
- "Mark as Booked" button: `bg-[#0F4C5C] text-white rounded-full` (Peacock Teal primary)
- Note input: branded focus ring `focus:border-[#0F4C5C] focus:ring-1 focus:ring-[#0F4C5C]`
- Selected date count: Playfair Display for the number, Manrope for the label

### Blocked Dates List

- Group by month (e.g., "March 2026" header, then dates)
- Each row: Warm Parchment bg, crimson left border accent, note in muted text
- Unblock: small "x" button, turns red on hover
- "Show more" expand instead of hard cutoff at 12

## Section 3: Event Date Picker (StepDetails.tsx)

### Popover Upgrade

- Replace manual div + useEffect click-outside with `Popover`/`PopoverContent` from Radix
- Inherits branded calendar from base component redesign
- Scale-in animation via Radix built-in support

### Trigger Button

- Calendar icon in Antique Gold `#C5A059`
- Selected date in Manrope 500 weight
- Placeholder in muted `#888888`
- Input styling: `border-[#E5E5E5] focus:border-[#0F4C5C]`
- Auto-closes on selection

## Section 4: Filter Sidebar & Availability Badge

### Filter Sidebar "Available On" Picker (FilterSidebar.jsx)

- Inherits base calendar redesign automatically (already uses `Calendar` + `Popover`)
- Trigger button calendar icon: gold `#C5A059`
- Clear button (X): hover state in crimson `#800020`

### Availability Badge (AvailabilityBadge.tsx)

- Available: `bg-[#2E7D32]/10 text-[#2E7D32] border border-[#2E7D32]/20` (design system success green)
- Unavailable: `bg-[#D32F2F]/10 text-[#D32F2F] border border-[#D32F2F]/20` (design system error red)
- Loading: Warm Parchment `bg-[#F9F8F4]` with gold spinner
- Entrance animation: fade-in on first render after loading

## Files to Modify

1. `frontend/src/components/ui/calendar.jsx` — base theming
2. `frontend/src/components/vendor/AvailabilityCalendar.tsx` — vendor calendar overhaul
3. `frontend/src/components/event/EventWizard/StepDetails.tsx` — popover + styling
4. `frontend/src/components/discovery/FilterSidebar.jsx` — icon + clear button color
5. `frontend/src/components/discovery/AvailabilityBadge.tsx` — badge colors + animation

## No New Dependencies

All changes use existing react-day-picker v8, date-fns, Radix UI, and Tailwind CSS.
