import pkg from 'jsonwebtoken'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { NextFunction, Response } from 'express'
import AppError from './appError'

const { JsonWebTokenError, NotBeforeError, TokenExpiredError } = pkg
// Remove User Data that should not be returned
export const removeUserColumns = <T extends { [key: string]: any }>(obj: T): T => {
	if (obj.hasOwnProperty('password')) delete obj.password
	if (obj.hasOwnProperty('id')) delete obj.id
	if (obj.hasOwnProperty('passwordUpdatedAt')) delete obj.passwordUpdatedAt
	if (obj.hasOwnProperty('created_at')) delete obj.created_at
	if (obj.hasOwnProperty('resetToken')) delete obj.resetToken
	if (obj.hasOwnProperty('resetTokenExpiresIn')) delete obj.resetTokenExpiresIn
	if (obj.hasOwnProperty('active')) delete obj.active
	if (obj.hasOwnProperty('role')) delete obj.role

	return obj
}

// Verify Token
export const verifyToken = <T extends jwt.JwtPayload>(reqToken: string): T | AppError => {
	try {
		const decodedToken = jwt.verify(reqToken, process.env.JWT_SECRET || '')
		if (typeof decodedToken === 'string') return new AppError(500, 'JsonWebToken')
		return decodedToken as T
	} catch (err) {
		// Order matters here. TokenExpiredError is a subclass of JsonWebTokenError. That's why JsonWebTokenError is at the end.

		if (err instanceof NotBeforeError) return new AppError(403, 'Your token is not active. Nice try!')

		if (err instanceof TokenExpiredError) return new AppError(403, 'Your token has expired! Please log in again.')

		if (err instanceof JsonWebTokenError) return new AppError(403, 'Invalid token. Please login in again.')
	}

	return new AppError(500, 'JsonWebToken')
}

export const hasPasswordChanged = (JWTTimestamp: number, passwordTimestamp: string) => JWTTimestamp < Date.parse(passwordTimestamp) / 1000

export const isEmptyObject = (obj: Object<unknown>) => Object.keys(obj).length === 0

export const createPasswordResetToken = (): PasswordResetTokenData => {
	const resetToken = crypto.randomBytes(32).toString('hex')
	const encryptedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
	const tokenExpiresIn = Date.now() + 10 * 60 * 1000
	return { resetToken, encryptedResetToken, tokenExpiresIn }
}

export const signToken = (id: number): string =>
	jwt.sign({ userId: id }, process.env.JWT_SECRET || '', {
		expiresIn: process.env.JWT_EXPIRES_IN,
	})

export const sendTokenByCookie = (token: string | undefined, res: Response, next: NextFunction) => {
	if (!process.env.JWT_COOKIE_EXPIRES_IN || !token) return next(new AppError(500))

	const cookieOptions = {
		expires: new Date(Date.now() + +process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
		secure: false,
		httpOnly: true,
	}

	if (process.env.NODE_ENV === 'production') cookieOptions.secure = true

	res.cookie('jwt', token, cookieOptions)
}

export const splitStringByPattern = (value: string, pattern: string): string => value.split(pattern)[1]

type PasswordResetTokenData = {
	resetToken: string
	encryptedResetToken: string
	tokenExpiresIn: number
}

interface Object<T> {
	[key: string]: T
}
