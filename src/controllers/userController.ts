import { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import {
	deleteMyAvatar,
	deleteMyCover,
	deleteUser,
	getMyUserId,
	getUserAndProjects,
	updateMyAvatar,
	updateMyCover,
	updateUser,
} from '../models/userModel'
import { patchAvatarSchema, patchCoverSchema, updateUserSchema } from '../services/routeSchema'
import { catchAsync } from '../utils/errorFunctions'
import AppError, { getSuccessMessage } from '../utils/appError'
import { idSchema, passwordSchema } from '../services/baseSchema'
import { removeAvatarImage, removeCoverImage, updateAvatarImage, updateCoverImage } from '../models/imagesModel'

export const upload = multer({
	storage: multer.memoryStorage(),
	fileFilter: (req, file, cb) => {
		const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
		if (ACCEPTED_IMAGE_TYPES.includes(file.mimetype)) cb(null, true)
		else cb(new AppError(400, 'Uploaded file is not a supported image format'))
	},
})

export const resizeAvatarImage = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	if (!req.file) return next()
	console.log(req.file)
	const resizedBuffer = await sharp(req.file.buffer).toFormat('png').resize(480, 480).toBuffer()
	req.file.buffer = resizedBuffer
	req.file.mimetype = 'image/png'
	req.file.filename = `avatar-${req.userId}-${Date.now()}.png`

	next()
})

export const resizeCoverImage = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	if (!req.file) return next()

	const resizedBuffer = await sharp(req.file.buffer).resize(1200, 300).keepMetadata().toFormat('png').toBuffer()
	req.file.buffer = resizedBuffer
	req.file.mimetype = 'image/png'
	req.file.filename = `cover-${req.userId}-${Date.now()}.png`
	next()
})

export const getUserAndProjectsHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const userId = idSchema.parse(req.params.userId).toString()

	const response = await getUserAndProjects(userId)
	if (response instanceof AppError) return next(response)
	const { userWithProjects, statusCode } = response

	res.status(statusCode).send(userWithProjects)
})

export const getMyUserIdHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const response = await getMyUserId(req.userId)
	if (response instanceof AppError) return next(response)
	const { userId, statusCode } = response

	res.status(statusCode).send(userId.toString())
})

export const updateMyAvatarHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	if (req.file) {
		const avatarUrl = await updateAvatarImage(req.file, req.userId)
		if (avatarUrl instanceof AppError) return next(avatarUrl)
		req.body.avatarURL = avatarUrl
	}
	const url = patchAvatarSchema.parse(req.body)
	const response = await updateMyAvatar(url.avatarURL, req.userId)
	if (response instanceof AppError) return next(response)
	const { avatarURL, statusCode, statusText = [] } = response

	res.status(statusCode).json({
		message: getSuccessMessage(statusCode, statusText),
		avatarURL,
	})
})

export const updateMyCoverHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	if (req.file) {
		const coverURL = await updateCoverImage(req.file, req.userId)
		if (coverURL instanceof AppError) return next(coverURL)
		req.body.coverURL = coverURL
	}
	const url = patchCoverSchema.parse(req.body)
	const response = await updateMyCover(url.coverURL, req.userId)
	if (response instanceof AppError) return next(response)
	const { coverURL, statusCode, statusText = [] } = response

	res.status(statusCode).json({
		message: getSuccessMessage(statusCode, statusText),
		coverURL,
	})
})

export const updateMeHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const userData = updateUserSchema.parse(req.body)
	const response = await updateUser(userData, req.userId)

	if (response instanceof AppError) return next(response)
	const { user, statusCode, statusText = [] } = response

	res.status(statusCode).json({
		message: getSuccessMessage(statusCode, statusText),
		user,
	})
})

export const deleteMeHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const password = passwordSchema.parse(req.body.password)

	const response = await deleteUser(password, req.userId)
	if (response instanceof AppError) return next(response)

	const coverImageResponse = await removeCoverImage(req.userId)
	const avatarImageResponse = await removeAvatarImage(req.userId)
	if (coverImageResponse instanceof AppError) return next(coverImageResponse)
	if (avatarImageResponse instanceof AppError) return next(avatarImageResponse)

	const { statusCode, statusText = [] } = response

	res.cookie('jwt', '')
	res.status(statusCode).json({
		message: getSuccessMessage(statusCode, statusText),
	})
})

export const deleteMyCoverHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const coverImageResponse = await removeCoverImage(req.userId)
	if (coverImageResponse instanceof AppError) return next(coverImageResponse)

	const response = await deleteMyCover(req.userId)
	if (response instanceof AppError) return next(response)
	const { statusCode, statusText = [] } = response

	res.status(statusCode).json({
		message: getSuccessMessage(statusCode, statusText),
	})
})

export const deleteMyAvatarHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const avatarImageResponse = await removeAvatarImage(req.userId)
	if (avatarImageResponse instanceof AppError) return next(avatarImageResponse)

	const response = await deleteMyAvatar(req.userId)
	if (response instanceof AppError) return next(response)
	const { statusCode, statusText = [] } = response

	res.status(statusCode).json({
		message: getSuccessMessage(statusCode, statusText),
	})
})
