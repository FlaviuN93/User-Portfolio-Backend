import bcrypt from 'bcrypt'
import crypto from 'crypto'

import supabase from '../services/supabase'
import AppError from '../utils/appError'
import {
	hasPasswordChanged,
	createPasswordResetToken,
	verifyToken,
	removeUserColumns,
	signAccessToken,
	signRefreshToken,
} from '../utils/functions'
import { IDefault, IRegisterUser, IUser, TokenPayload, User, UserRoles } from './types'
import Email from '../utils/email'

export const registerUser = async (email: string, password: string): Promise<IRegisterUser | AppError> => {
	const hashedPassword = await bcrypt.hash(password, 12)
	const { data: user, error, status } = await supabase.from('users').insert({ email, password: hashedPassword }).select('id,email').single()

	if (error) return new AppError(status, 'Email already exists. Please register with a different email')
	if (!user) return new AppError(400)

	const accessToken = signAccessToken(user.id)
	const refreshToken = signRefreshToken(user.id)

	return { email: user.email, accessToken, refreshToken, statusCode: 201, statusText: ['user', 'created'] }
}

export const loginUser = async (email: string, loginPassword: string): Promise<IUser | AppError> => {
	const { data: user } = await supabase.from('users').select('*').eq('email', email).single()
	if (!user) return new AppError(400, `Your user credentials don't match. Try again.`)
	const arePasswordsEqual = await bcrypt.compare(loginPassword, user.password)
	if (!arePasswordsEqual) return new AppError(401, `Hmm, your user credentials don't match. Try again`)

	const accessToken = signAccessToken(user.id)
	const refreshToken = signRefreshToken(user.id)
	const loginUser = removeUserColumns<User>(user)

	return { user: loginUser, accessToken, refreshToken, statusCode: 200, statusText: ['sign in', 'Welcome back'] }
}

export const updatePassword = async (password: string, userId: string): Promise<IDefault | AppError> => {
	const { data: user } = await supabase.from('users').select('*').eq('id', userId).single()
	if (!user) return new AppError(403, 'User token has probably expired. Try again.')
	const hashedPassword = await bcrypt.hash(password, 12)

	const { error, status } = await supabase
		.from('users')
		.update({ password: hashedPassword, passwordUpdatedAt: new Date().toISOString() })
		.eq('id', user.id)

	if (error) return new AppError(status)

	return {
		statusCode: 200,
		statusText: ['update password', 'Your new password was updated successfully'],
	}
}

export const forgotPassword = async (email: string): Promise<IDefault | AppError> => {
	const { data: user } = await supabase.from('users').select('email,fullName,resetTokenExpiresIn').eq('email', email).single()

	if (!user) return new AppError(404, 'There is no user with the email you entered. Please try again.')

	const timeleft = Math.trunc((user.resetTokenExpiresIn - Date.now()) / (1000 * 60))
	if (Date.now() < user.resetTokenExpiresIn)
		return new AppError(
			429,
			`You have already made a request to reset your password. Check your email or try again in ${timeleft} minutes.`
		)

	const { resetToken, encryptedResetToken, tokenExpiresIn } = createPasswordResetToken()
	await supabase
		.from('users')
		.update({ resetToken: encryptedResetToken, resetTokenExpiresIn: tokenExpiresIn })
		.eq('email', email)
		.select('id')
		.single()

	try {
		const url = `${process.env.VITE_APP_LOCAL_DOMAIN}/auth/reset-password`
		const resetURL = `${url}/${resetToken}`
		await new Email({ email: user.email, fullName: user.fullName }, { url: resetURL }).sendResetPassword()
	} catch (err) {
		return new AppError(500, 'There was an error sending the email. Try again later!')
	}

	return { statusCode: 200, statusText: ['forgot password', 'The reset link was send to your email'] }
}

export const resetPassword = async (newPassword: string, resetToken: string): Promise<IDefault | AppError> => {
	const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
	const { data: user } = await supabase
		.from('users')
		.select('id,resetToken')
		.eq('resetToken', hashedToken)
		.gt('resetTokenExpiresIn', Date.now())
		.single()

	if (!user) return new AppError(400, 'Token is invalid or has expired!')
	if (!user.resetToken)
		return new AppError(
			429,
			'You have already made a succesful request to reset your password. If you want to change it again, go to the forgot password page and start again.'
		)

	const hashedPassword = await bcrypt.hash(newPassword, 12)
	await supabase
		.from('users')
		.update({
			password: hashedPassword,
			resetToken: '',
			resetTokenExpiresIn: null,
			passwordUpdatedAt: new Date().toISOString(),
		})
		.eq('resetToken', hashedToken)

	return {
		statusCode: 200,
		statusText: ['reset password', 'Your new password was saved successfully'],
	}
}

export const checkResetToken = async (resetToken: string): Promise<string | AppError> => {
	const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
	const { data: user } = await supabase
		.from('users')
		.select('id,resetToken')
		.eq('resetToken', hashedToken)
		.gt('resetTokenExpiresIn', Date.now())
		.single()

	if (!user) return new AppError(401, 'Reset token is invalid or has expired.')
	return 'Success'
}

export const protect = async (reqToken: string): Promise<{ user: { id: string; role: UserRoles } } | AppError> => {
	if (!reqToken) return new AppError(401, 'You are not logged in. Please log in to gain access')

	const decodedToken = verifyToken<TokenPayload>(reqToken, 'access')
	if (decodedToken instanceof AppError) return decodedToken

	const { data: user } = await supabase.from('users').select('id,passwordUpdatedAt,role').eq('id', decodedToken.userId).single()
	if (!user) return new AppError(401, 'You are not logged in. Please log in to gain access')

	const isPasswordChanged = hasPasswordChanged(decodedToken.iat as number, user.passwordUpdatedAt)
	if (isPasswordChanged) return new AppError(401, 'You recently changed password! Please log in again')

	return { user: { id: user.id.toString(), role: user.role } }
}
