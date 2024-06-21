import { z } from 'zod'
import bcrypt from 'bcrypt'
import supabase from '../services/supabase'
import { updateUserSchema } from '../services/routeSchema'
import AppError from '../utils/appError'
import { removeUserColumns } from '../utils/functions'
import { User, IDefault, IUser, IUserAndProjects, UserAndProjects, IImageURL } from './types'

export const getUserAndProjects = async (userId: string): Promise<IUserAndProjects | AppError> => {
	const { data: userWithProjects, error } = await supabase.from('users').select(`*, projects(*)`).eq('id', userId).single()

	if (error) return new AppError(500, 'Something went wrong while trying to get your user and project data. Give us some time to fix this.')

	const newUser = removeUserColumns<UserAndProjects>(userWithProjects)
	return {
		userWithProjects: newUser,
		statusCode: 200,
	}
}

export const getMyUserId = async (userId: string): Promise<{ userId: number; statusCode: number } | AppError> => {
	const { data, error } = await supabase.from('users').select(`id`).eq('id', userId).single()
	if (error) return new AppError(500, 'Something went wrong while trying to get your user id. Give us some time to fix this.')

	return {
		userId: data.id,
		statusCode: 200,
	}
}

export const updateUser = async (reqBody: UpdateUserType, userId: string): Promise<IUser | AppError> => {
	const { data: user, error, status } = await supabase.from('users').update(reqBody).eq('id', userId).select('*').single()
	if (error) return new AppError(status)

	const newUser = removeUserColumns<User>(user)

	return {
		user: newUser,
		statusCode: 200,
		statusText: ['update', 'Your profile information has been updated successfully'],
	}
}

export const updateMyAvatar = async (avatarURL: string | null, userId: string): Promise<IImageURL | AppError> => {
	const { data: url } = await supabase.from('projects').select('avatarURL').eq('id', userId).single()
	if (avatarURL === null) avatarURL = url?.avatarURL

	const { data, error, status } = await supabase.from('users').update({ avatarURL }).eq('id', userId).select('avatarURL').single()
	if (error) return new AppError(status)

	return {
		imageURL: data?.avatarURL,
		statusCode: 200,
		statusText: ['update', 'Your profile information has been updated succesfully'],
	}
}

export const updateMyCover = async (coverURL: string | null, userId: string): Promise<IImageURL | AppError> => {
	const { data: url } = await supabase.from('projects').select('coverURL').eq('id', userId).single()
	if (coverURL === null) coverURL = url?.coverURL

	const { data, error, status } = await supabase.from('users').update({ coverURL }).eq('id', userId).select('coverURL').single()
	if (error) return new AppError(status)

	return {
		imageURL: data?.coverURL,
		statusCode: 200,
		statusText: ['update', 'Your profile information has been updated succesfully'],
	}
}

export const deleteUser = async (password: string, userId: string): Promise<IDefault | AppError> => {
	const { data: user } = await supabase.from('users').select('*').eq('id', userId).single()

	const arePasswordsEqual = await bcrypt.compare(password, user.password)
	if (!arePasswordsEqual) return new AppError(401, `Hmm, your passwords don't match. Try again.`)

	const { error, status } = await supabase.from('users').delete().eq('id', userId).select('fullName').single()
	if (error) return new AppError(status)

	return { statusCode: 200, statusText: ['delete', `Your Account has been deleted`] }
}

export const deleteMyCover = async (userId: string): Promise<IDefault | AppError> => {
	const { error, status } = await supabase.from('users').update({ coverURL: '' }).eq('id', userId)
	if (error) return new AppError(status)

	return { statusCode: 200, statusText: ['delete', `Your cover image has been deleted`] }
}

export const deleteMyAvatar = async (userId: string): Promise<IDefault | AppError> => {
	const { error, status } = await supabase.from('users').update({ avatarURL: '' }).eq('id', userId)

	if (error) return new AppError(status)
	return { statusCode: 200, statusText: ['delete', `Your avatar image has been deleted`] }
}

type UpdateUserType = z.infer<typeof updateUserSchema>
