import { z } from 'zod'
import { CATEGORY_TYPE_CODES } from '../../constants/categoryTypes'

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(60, 'Name must be under 60 characters'),
  type: z.enum(CATEGORY_TYPE_CODES, { errorMap: () => ({ message: 'Select a category type' }) }),
  is_essential: z.boolean(),
})
