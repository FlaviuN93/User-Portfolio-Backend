import supabase from '../services/supabase'
import AppError from '../utils/appError'
import { splitStringByPattern } from '../utils/functions'

export const addProjectImage = async (file: Express.Multer.File): Promise<string | AppError> => {
	const { data: url, error } = await supabase.storage
		.from('project-images')
		.upload(file.filename, file.buffer, { contentType: file.mimetype })

	if (error) return new AppError(400)
	const { data } = supabase.storage.from('project-images').getPublicUrl(url.path)

	return data.publicUrl
}

export const updateProjectImage = async (file: Express.Multer.File, projectId?: string): Promise<string | AppError> => {
	const { data: urlPath } = await supabase.from('projects').select('imageURL').eq('id', projectId).single()
	if (urlPath?.imageURL) {
		const filePath = splitStringByPattern(urlPath.imageURL, 'project-images/')
		const { error: deleteError } = await supabase.storage.from('project-images').remove([filePath])
		if (deleteError) return new AppError(400, 'The image could not be updated. Something went wrong with your request.')
	}

	const { data: url, error } = await supabase.storage
		.from('project-images')
		.upload(file.filename, file.buffer, { contentType: file.mimetype })

	if (error) return new AppError(400)

	const { data } = supabase.storage.from('project-images').getPublicUrl(url.path)
	return data.publicUrl
}

export const removeProjectImage = async (projectId: string): Promise<string | AppError> => {
	const { data: urlPath, error } = await supabase.from('projects').select('imageURL').eq('id', projectId).single()

	if (error) return new AppError(400)

	const filePath = splitStringByPattern(urlPath.imageURL, 'project-images/')
	const { error: deleteError } = await supabase.storage.from('project-images').remove([filePath])
	if (deleteError) return new AppError(400, 'The image could not be deleted. Something went wrong with your request.')

	return 'Image deleted succesfully'
}

export const updateAvatarImage = async (file: Express.Multer.File, userId: string): Promise<string | AppError> => {
	const { data: urlPath } = await supabase.from('users').select('avatarURL').eq('id', userId).single()

	if (urlPath?.avatarURL) {
		const filePath = splitStringByPattern(urlPath.avatarURL, 'avatars/')
		const { error: deleteError } = await supabase.storage.from('avatars').remove([filePath])
		if (deleteError) return new AppError(500, 'The image could not be updated. Something went wrong with your request.')
	}

	const { data: url, error } = await supabase.storage.from('avatars').upload(file.filename, file.buffer, { contentType: file.mimetype })

	if (error) return new AppError(400)

	const { data } = supabase.storage.from('avatars').getPublicUrl(url.path)

	return data.publicUrl
}

export const removeAvatarImage = async (userId: string): Promise<string | AppError> => {
	const { data: urlPath, error } = await supabase.from('users').select('avatarURL').eq('id', userId).single()

	if (error) return new AppError(400)

	const filePath = splitStringByPattern(urlPath.avatarURL, 'avatars/')
	const { error: deleteError } = await supabase.storage.from('avatars').remove([filePath])
	if (deleteError) return new AppError(400, 'The image could not be deleted. Something went wrong with your request.')

	return 'Image deleted succesfully'
}

export const updateCoverImage = async (file: Express.Multer.File, userId: string): Promise<string | AppError> => {
	const { data: urlPath } = await supabase.from('users').select('coverURL').eq('id', userId).single()
	if (urlPath?.coverURL) {
		const filePath = splitStringByPattern(urlPath.coverURL, 'user-covers/')
		const { error: deleteError } = await supabase.storage.from('user-covers').remove([filePath])
		if (deleteError) return new AppError(400, 'The image could not be updated. Something went wrong with your request.')
	}

	const { data: url, error } = await supabase.storage.from('user-covers').upload(file.filename, file.buffer, { contentType: file.mimetype })

	if (error) return new AppError(400)

	const { data } = supabase.storage.from('user-covers').getPublicUrl(url.path)

	return data.publicUrl
}

export const removeCoverImage = async (userId: string): Promise<string | AppError> => {
	const { data: urlPath, error } = await supabase.from('users').select('coverURL').eq('id', userId).single()

	if (error) return new AppError(400)

	const filePath = splitStringByPattern(urlPath.coverURL, 'user-covers/')
	const { error: deleteError } = await supabase.storage.from('user-covers').remove([filePath])
	if (deleteError) return new AppError(400, 'The image could not be deleted. Something went wrong with your request.')

	return 'Image deleted succesfully'
}
