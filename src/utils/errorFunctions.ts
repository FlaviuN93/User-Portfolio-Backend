import { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { MulterError } from 'multer'
import AppError from './appError'
import { isEmptyObject } from './functions'

const unknownErrorMessage = 'Something went wrong on our end. Please give us time to fix the problem.'
// Helper Functions

const unknownError = (err: Error, res: Response, message?: string): void => {
	console.log(err.message)
	res.status(500).json({
		type: 'serverError',
		message: message ? message : err.message,
	})
}

const sendError = (err: AppError, res: Response, type: 'clientError' | 'serverError'): void => {
	res.status(err.statusCode).json({
		type,
		message: err.message,
		stack: err.stack,
	})
}

const sendZodError = (err: ZodError, res: Response): void => {
	const formattedErrors = err.flatten()
	const errorMessage = isEmptyObject(formattedErrors.fieldErrors) ? formattedErrors.formErrors : formattedErrors.fieldErrors

	res.status(400).json({
		type: 'zodError',
		message: errorMessage,
	})
}

const sendMulterError = (err: MulterError, res: Response): void => {
	if (process.env.NODE_ENV === 'development') {
		console.log(err.field, err.code, err.message, 'multerError')
	}

	res.status(400).json({
		type: 'clientError',
		message: err.message,
	})
}

const sendErrorInDev = (err: AppError, res: Response) => {
	// Order matters. This check is first
	if (err instanceof TypeError) return unknownError(err, res)
	if (err instanceof ZodError) return sendZodError(err, res)
	if (err instanceof MulterError) return sendMulterError(err, res)

	if (!err.isClientError) return unknownError(err, res)

	sendError(err, res, 'clientError')
}

const sendErrorInProd = (err: AppError, res: Response) => {
	// Order matters. This check is first
	if (err instanceof TypeError) return unknownError(err, res, unknownErrorMessage)

	if (err instanceof ZodError) return sendZodError(err, res)
	if (err instanceof MulterError) return sendMulterError(err, res)

	if (!err.isClientError) return unknownError(err, res, unknownErrorMessage)

	res.status(err.statusCode).json({
		type: 'clientError',
		message: err.message,
	})
}

// Main Functions
export const globalErrorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
	if (process.env.NODE_ENV === 'development') sendErrorInDev(err, res)
	else sendErrorInProd(err, res)
}

// This function wrapper catches any error in a handler function and sends it to the globalErrorHandler
export const catchAsync = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any | void>) => {
	return (req: Request, res: Response, next: NextFunction) => {
		fn(req, res, next).catch(next)
	}
}
