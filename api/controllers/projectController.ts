import { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import { createProjectSchema } from '../services/routeSchema'
import { catchAsync } from '../utils/errorFunctions'
import { createMyProject, deleteMyProject, getMyProject, getMyProjects, getTechnologies, updateMyProject } from '../models/projectModel'
import AppError, { getSuccessMessage } from '../utils/appError'
import { idSchema } from '../services/baseSchema'
import { removeProjectImage, updateProjectImage } from '../models/imagesModel'

const upload = multer({
	storage: multer.memoryStorage(),
	fileFilter: async (req, file, cb) => {
		const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
		if (ACCEPTED_IMAGE_TYPES.includes(file.mimetype)) cb(null, true)
		else cb(new AppError(400))
	},
	limits: { fileSize: 1024 * 1024 * 5 },
})

export const uploadProjectImage = upload.single('imageFile')
export const resizeProjectImage = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	if (!req.file) return next()

	const reSizedBuffer = await sharp(req.file.buffer).resize(1200, 800, { fit: 'inside' }).withMetadata().toFormat('png').toBuffer()

	req.file.buffer = reSizedBuffer
	req.file.mimetype = 'image/png'
	req.file.filename = `project-${req.userId}-${Date.now()}.png`
	next()
})

export const getTechnologiesData = async (req: Request, res: Response, next: NextFunction) => {
	const response = await getTechnologies()
	if (response instanceof AppError) return next(response)

	const { technologies, statusCode } = response

	res.status(statusCode).send(technologies)
}

export const getMyProjectsData = async (req: Request, res: Response, next: NextFunction) => {
	const response = await getMyProjects(req.userId)
	if (response instanceof AppError) return next(response)

	const { projects, statusCode } = response
	res.status(statusCode).send(projects)
}

export const getMyProjectData = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const projectId = idSchema.parse(req.params.projectId).toString()
	const response = await getMyProject(req.userId, projectId)

	if (response instanceof AppError) return next(response)
	const { project, statusCode } = response

	res.status(statusCode).send(project)
})

export const createMyProjectData = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const reqBody = JSON.parse(req.body.body)
	reqBody.user_id = req.userId

	if (req.file) {
		const url = await updateProjectImage(req.file, undefined)
		if (url instanceof AppError) return next(url)
		reqBody.imageURL = url
	}

	const projectData = createProjectSchema.parse(reqBody)
	const response = await createMyProject(projectData)
	if (response instanceof AppError) return next(response)
	const { statusCode, statusText = [] } = response

	res.status(statusCode).json({
		message: getSuccessMessage(statusCode, statusText),
	})
})

export const updateMyProjectData = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const reqBody = JSON.parse(req.body.body)
	reqBody.user_id = req.userId
	const projectId = idSchema.parse(req.params.projectId).toString()

	if (req.file) {
		const url = await updateProjectImage(req.file, projectId)
		if (url instanceof AppError) return next(url)
		reqBody.imageURL = url
	}

	const projectData = createProjectSchema.parse(reqBody)
	const response = await updateMyProject(projectData, projectId)
	if (response instanceof AppError) return next(response)

	const { statusCode, statusText = [] } = response

	res.status(statusCode).json({
		message: getSuccessMessage(statusCode, statusText),
	})
})

export const deleteMyProjectData = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const projectId = idSchema.parse(req.params.projectId).toString()

	const imageResponse = await removeProjectImage(projectId)
	if (imageResponse instanceof AppError) return next(imageResponse)

	const response = await deleteMyProject(projectId)
	if (response instanceof AppError) return next(response)
	const { statusCode, statusText = [] } = response

	res.status(statusCode).json({
		message: getSuccessMessage(statusCode, statusText),
	})
})
