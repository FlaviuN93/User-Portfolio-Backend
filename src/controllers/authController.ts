import { NextFunction, Request, Response } from 'express'
import { checkResetToken, forgotPassword, loginUser, protect, registerUser, resetPassword, updatePassword } from '../models/authModel'

import Email from '../utils/email'
import { catchAsync } from '../utils/errorFunctions'
import { authSchema, contactUsSchema, forgotPasswordSchema, resetPasswordSchema } from '../services/routeSchema'
import AppError, { getSuccessMessage } from '../utils/appError'
import { sendTokenByCookie, signAccessToken, verifyToken } from '../utils/functions'
import { TokenPayload, UserRoles } from '../models/types'
import { stringSchema } from '../services/baseSchema'

export const registerUserHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const { email, password } = await authSchema.parseAsync(req.body)

	const response = await registerUser(email, password)
	if (response instanceof AppError) return next(response)

	const { email: savedEmail, accessToken, refreshToken, statusCode, statusText = [] } = response
	sendTokenByCookie(refreshToken, res, next)

	const url = `${process.env.VITE_APP_LOCAL_DOMAIN}/auth/login`
	await new Email({ email: savedEmail, fullName: '' }, { url }).sendWelcome()

	res.status(statusCode).json({
		message: getSuccessMessage(statusCode, statusText),
		email: savedEmail,
		token: accessToken,
	})
})

export const loginUserHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const { email, password } = await authSchema.parseAsync(req.body)
	const response = await loginUser(email, password)

	if (response instanceof AppError) return next(response)
	const { user, accessToken, refreshToken, statusCode, statusText = [] } = response

	sendTokenByCookie(refreshToken, res, next)

	res.status(statusCode).json({
		message: getSuccessMessage(statusCode, statusText),
		user,
		token: accessToken,
	})
})

export const refreshTokenHandler = async (req: Request, res: Response, next: NextFunction) => {
	if (!req.cookies.jwt) return next(new AppError(401))
	const decodedToken = verifyToken<TokenPayload>(req.cookies.jwt, 'refresh')

	if (decodedToken instanceof AppError) return next(decodedToken)
	const accessToken = signAccessToken(decodedToken.userId.toString())

	res.json({ token: accessToken })
}

export const logoutMeHandler = (req: Request, res: Response, next: NextFunction) => {
	if (req.cookies.jwt) {
		res.clearCookie('jwt')
		res.status(200).json({ message: 'Log out Successful!' })
	}
}

export const updatePasswordHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const { password } = resetPasswordSchema.parse(req.body)

	const response = await updatePassword(password, req.userId)
	if (response instanceof AppError) return next(response)
	const { statusCode, statusText = [] } = response

	res.status(statusCode).json({
		message: getSuccessMessage(statusCode, statusText),
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

	res.status(200).send('Success')
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
	if (!req.headers.authorization?.startsWith('Bearer ')) return next(401)
	const token = req.headers.authorization.split(' ')[1]

	const response = await protect(token)
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
