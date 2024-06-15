import { NextFunction, Request, Response } from 'express'
import { checkResetToken, forgotPassword, loginUser, protect, registerUser, resetPassword, updatePassword } from '../models/authModel'

import Email from '../utils/email'
import { catchAsync } from '../utils/errorFunctions'
import { authSchema, contactUsSchema, forgotPasswordSchema, resetPasswordSchema } from '../services/routeSchema'
import AppError, { getSuccessMessage } from '../utils/appError'
import { sendTokenByCookie } from '../utils/functions'
import { UserRoles } from '../models/types'
import { stringSchema } from '../services/baseSchema'

// Have to come up with a default image avatar for when the user first registers and assign it to the user on the
// supabase database.
export const registerUserHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const { email, password } = await authSchema.parseAsync(req.body)

	const response = await registerUser(email, password)
	if (response instanceof AppError) return next(response)

	const { email: savedEmail, token, statusCode, statusText = [] } = response
	sendTokenByCookie(token, res, next)

	const url = `${process.env.VITE_APP_LOCAL_DOMAIN}/auth/login`
	await new Email({ email: savedEmail, fullName: '' }, { url }).sendWelcome()

	res.status(statusCode).json({
		message: getSuccessMessage(statusCode, statusText),
		email: savedEmail,
	})
})

export const loginUserHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const { email, password } = await authSchema.parseAsync(req.body)
	const response = await loginUser(email, password)

	if (response instanceof AppError) return next(response)
	const { user, token, statusCode, statusText = [] } = response
	sendTokenByCookie(token, res, next)
	res.status(statusCode).json({
		message: getSuccessMessage(statusCode, statusText),
		user,
	})
})

export const logoutMeHandler = (req: Request, res: Response, next: NextFunction) => {
	if (req.cookies.jwt) {
		res.clearCookie('jwt')
		res.status(200).json({ message: 'Log out Successful!' })
	} else return next(new AppError(403, 'You are unauthorized to perform this action'))
}

export const updatePasswordHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const { password } = resetPasswordSchema.parse(req.body)

	const response = await updatePassword(password, req.userId)
	if (response instanceof AppError) return next(response)
	const { user, token, statusCode, statusText = [] } = response

	sendTokenByCookie(token, res, next)
	res.status(statusCode).json({
		message: getSuccessMessage(statusCode, statusText),
		user,
	})
})

export const forgotPasswordHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const { email } = forgotPasswordSchema.parse(req.body)
	const response = await forgotPassword(email)

	if (response instanceof AppError) return next(response)
	const { statusCode, statusText = [] } = response

	res.status(statusCode).json({
		message: getSuccessMessage(statusCode, statusText),
	})
})

export const checkResetTokenHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const resetToken = stringSchema.parse(req.params.resetToken)
	const response = await checkResetToken(resetToken)
	if (response instanceof AppError) return next(response)
})

export const resetPasswordHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const { password } = resetPasswordSchema.parse(req.body)
	const response = await resetPassword(password, req.params.resetToken)

	if (response instanceof AppError) return next(response)
	const { statusCode, statusText = [] } = response

	res.status(statusCode).json({
		message: getSuccessMessage(statusCode, statusText),
	})
})

export const contactUsHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const reqBody = contactUsSchema.parse(req.body)

	await new Email({ email: reqBody.email, fullName: reqBody.name }).contactUs()
	await new Email({ email: process.env.EMAIL_FROM || '', fullName: reqBody.name }, { feedbackMessage: reqBody.message }).feedbackEmail()

	res.status(200).json({ message: 'Your message has been received' })
})

export const protectHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const response = await protect(req.cookies.jwt)
	if (response instanceof AppError) return next(response)

	req.userId = response.user.id
	req.userRole = response.user.role
	next()
})

export const userRolesHandler =
	(...roles: UserRoles[]) =>
	(req: Request, res: Response, next: NextFunction) => {
		if (!roles.includes(req.userRole as UserRoles)) return next(new AppError(403, 'You do not have permission to perform this action'))
		next()
	}
