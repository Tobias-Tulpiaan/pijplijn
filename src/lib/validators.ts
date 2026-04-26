import { z } from 'zod'

export const passwordRules = {
  minLength: (s: string) => s.length >= 12,
  hasUpper: (s: string) => /[A-Z]/.test(s),
  hasLower: (s: string) => /[a-z]/.test(s),
  hasDigit: (s: string) => /[0-9]/.test(s),
  hasSpecial: (s: string) => /[!@#$%^&*(),.?":{}|<>]/.test(s),
  noSpaces: (s: string) => !/\s/.test(s),
}

export function validatePassword(password: string): string | null {
  if (!passwordRules.minLength(password)) return 'Wachtwoord moet minimaal 12 tekens zijn'
  if (!passwordRules.hasUpper(password)) return 'Wachtwoord moet minimaal 1 hoofdletter bevatten'
  if (!passwordRules.hasLower(password)) return 'Wachtwoord moet minimaal 1 kleine letter bevatten'
  if (!passwordRules.hasDigit(password)) return 'Wachtwoord moet minimaal 1 cijfer bevatten'
  if (!passwordRules.hasSpecial(password)) return 'Wachtwoord moet minimaal 1 speciaal teken bevatten (!@#$%^&*...)'
  if (!passwordRules.noSpaces(password)) return 'Wachtwoord mag geen spaties bevatten'
  return null
}

export const candidateSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  ownerId: z.string().min(1),
  companyId: z.string().nullable().optional(),
  contactId: z.string().nullable().optional(),
  vacatureId: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
  linkedinUrl: z.string().url().nullable().optional().or(z.literal('')),
  notes: z.string().nullable().optional(),
  stage: z.number().int().min(0).max(100).optional(),
})

export const companySchema = z.object({
  name: z.string().min(1),
  customCode: z.string().nullable().optional(),
  contactPerson: z.string().nullable().optional(),
  contactEmail: z.string().email().nullable().optional().or(z.literal('')),
  contactPhone: z.string().nullable().optional(),
})

export const vacatureSchema = z.object({
  title: z.string().min(1),
  companyId: z.string().min(1),
  consultantId: z.string().min(1),
  contactId: z.string().nullable().optional(),
  status: z.enum(['open', 'on_hold', 'vervuld', 'gesloten']).optional(),
  positions: z.union([z.string(), z.number()]).optional(),
})

export const taskSchema = z.object({
  title: z.string().min(1),
  dueDate: z.string().nullable().optional(),
  dueTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).nullable().optional().or(z.literal('')).or(z.null()),
  candidateId: z.string().nullable().optional(),
  assignedToId: z.string().nullable().optional(),
  isShared: z.boolean().optional(),
  completed: z.boolean().optional(),
})

export const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().nullable().optional().or(z.literal('')),
  phone: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  companyId: z.string().min(1),
})
