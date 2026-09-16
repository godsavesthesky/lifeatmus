/**
 * Single source of truth for company departments.
 * `as const` is required so `Department` becomes a union of literals
 * instead of plain `string` — that's what makes `User['department']`
 * and the <select> in Admin.tsx type-safe.
 */
export const DEPARTMENTS = [
  // Tech
  'Software Developer',
  'Web Developer',
  'AI Engineer',
  'IT Support',
  'Drafter',

  // Marketing & Creative
  'Digital Marketing',
  'Social Media Strategist',
  'KOL Specialist',
  'Content Creator',
  'Videographer',
  'Desain Grafis',
  'Marketing Communication (Marcom)',
  'Public Relation',

  // Corporate
  'HR (Human Resources)',
  'Legal',
  'Admin Keuangan',
  'Purchasing',
  'Staf Logistik',

  // Internship
  'Facilities Management Intern',
  'GA Intern',
  'Manager Intern',

  // Kitchen
  'Pastry Kitchen Staff',
  'Central Kitchen',
] as const

export type Department = (typeof DEPARTMENTS)[number]