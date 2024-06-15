import { emailSchema, passwordSchema, descriptionSchema, nameSchema, urlSchema, bioSchema, jobSchema } from './baseSchema'
import { z } from 'zod'

// Auth Schema
export const authSchema = z.object({
	email: emailSchema,
	password: passwordSchema,
})

export const forgotPasswordSchema = z.object({
	email: emailSchema,
})

export const resetPasswordSchema = z
	.object({
		password: passwordSchema,
		confirmPassword: passwordSchema,
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword'],
	})

// Project Schema
export const createProjectSchema = z.object({
	imageURL: z.union([urlSchema, z.null()]),
	name: nameSchema,
	demoURL: urlSchema,
	repositoryURL: urlSchema,
	technologies: z.array(z.string()).min(2, 'Select a minimum of 2 technologies').max(5, 'Select a maximum of 5 technologies'),
	description: descriptionSchema,
	user_id: z.string(),
})

// User Schema
export const updateUserSchema = z.object({
	email: z.union([emailSchema, z.literal('')]),
	fullName: z.union([nameSchema, z.literal('')]),
	jobTitle: z.union([jobSchema, z.literal('')]),
	linkedin: z.union([urlSchema, z.literal('')]),
	bio: z.union([bioSchema, z.literal('')]),
})

export const patchCoverSchema = z.object({
	coverURL: z.union([urlSchema, z.null()]),
})

export const patchAvatarSchema = z.object({
	avatarURL: z.union([urlSchema, z.null()]),
})

export const contactUsSchema = z.object({
	email: emailSchema,
	name: nameSchema,
	message: z
		.string()
		.trim()
		.min(50, `You should write at least 50 characters. Tell us what's on your mind.`)
		.max(500, `Your message is too long. Try to be more concise with your message.`)
		.regex(/^[a-zA-Z0-9,.-\s]+$/, 'Your message can only contain letters and numbers.'),
})
