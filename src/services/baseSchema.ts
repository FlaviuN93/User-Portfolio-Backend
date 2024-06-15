import { z } from 'zod'

// Base Schemas
export const emailSchema = z.string().trim().email({ message: 'Your email address is not valid. Try again.' })

export const idSchema = z.coerce
	.number({
		invalid_type_error: 'The id you added to the request is not a number',
	})
	.int({ message: 'Id must be an integer' })
	.lte(100000, { message: 'Your value is too large for an id' })
	.positive({ message: `Id should not have a negative value` })

export const passwordSchema = z
	.string()
	.trim()
	.regex(/^.{8,}/, ' Must have at least 8 characters')
	.regex(/^.{1,20}$/, ' Must have a maximum of 20 characters')
	.regex(/[a-z]/, ' Must have one lowercase character')
	.regex(/[A-Z]/, ' Must have one uppercase character')
	.regex(/\d/, ' Must contain one number')
	.regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/, 'Must contain a special characters')

export const nameSchema = z
	.string()
	.trim()
	.min(4, 'Your name is too short. Please enter at least 4 characters.')
	.max(50, 'Your name is too long.')
	.regex(/^[a-zA-Z_-\s]+$/, 'You can only add letters to your name')

export const jobSchema = z
	.string()
	.trim()
	.min(4, 'Please enter your current job title. It helps showcase your experience.')
	.max(50, 'Your job title is too long.')
	.regex(/^[a-zA-Z_-\s]+$/, 'Your job title can only contain letters')

export const descriptionSchema = z
	.string()
	.trim()
	.min(125, 'Must be at least 125 characters long.')
	.max(250, 'Cannot exceed 250 characters.')
	.regex(/^[a-zA-Z0-9\s\.\!\?\'\,\-]+$/, 'Cannot contain special characters. Keep it simple and clean.')

export const bioSchema = z
	.string()
	.trim()
	.min(175, 'Must be at least 175 characters long.')
	.max(350, 'Cannot exceed 350 characters.')
	.regex(/^[a-zA-Z0-9\s\.\!\?\'\,\-]+$/, 'Cannot contain special characters. Keep it simple and clean.')

export const urlSchema = z.string().trim().min(1, 'Please enter a repository URL.').url('Invalid URL')
export const stringSchema = z.string().trim()
