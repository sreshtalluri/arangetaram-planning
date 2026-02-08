export const METRO_AREAS = [
  // California
  { value: 'sf-bay-area', label: 'San Francisco Bay Area', state: 'CA' },
  { value: 'los-angeles', label: 'Los Angeles', state: 'CA' },
  { value: 'san-diego', label: 'San Diego', state: 'CA' },
  // Texas
  { value: 'houston', label: 'Houston', state: 'TX' },
  { value: 'dallas-ft-worth', label: 'Dallas-Fort Worth', state: 'TX' },
  { value: 'austin', label: 'Austin', state: 'TX' },
  // East Coast
  { value: 'nyc-metro', label: 'New York City Metro', state: 'NY/NJ' },
  { value: 'boston', label: 'Boston', state: 'MA' },
  { value: 'washington-dc', label: 'Washington D.C. Metro', state: 'DC/VA/MD' },
  { value: 'philadelphia', label: 'Philadelphia', state: 'PA' },
  // Midwest
  { value: 'chicago', label: 'Chicago', state: 'IL' },
  { value: 'detroit', label: 'Detroit', state: 'MI' },
  { value: 'minneapolis', label: 'Minneapolis', state: 'MN' },
  // Southeast
  { value: 'atlanta', label: 'Atlanta', state: 'GA' },
  { value: 'charlotte', label: 'Charlotte', state: 'NC' },
  { value: 'raleigh', label: 'Raleigh-Durham', state: 'NC' },
  { value: 'tampa', label: 'Tampa Bay', state: 'FL' },
  // Pacific Northwest
  { value: 'seattle', label: 'Seattle', state: 'WA' },
  { value: 'portland', label: 'Portland', state: 'OR' },
  // Other
  { value: 'phoenix', label: 'Phoenix', state: 'AZ' },
  { value: 'denver', label: 'Denver', state: 'CO' },
] as const

export type MetroArea = typeof METRO_AREAS[number]['value']
