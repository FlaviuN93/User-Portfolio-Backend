import express from 'express'
import {
	checkResetTokenHandler,
	contactUsHandler,
	forgotPasswordHandler,
	loginUserHandler,
	logoutMeHandler,
	protectHandler,
	refreshTokenHandler,
	registerUserHandler,
	resetPasswordHandler,
	updatePasswordHandler,
	userRolesHandler,
} from '../controllers/authController'

const authRouter = express.Router()

authRouter.route('/contactUs').post(contactUsHandler)
authRouter.route('/register').post(registerUserHandler)
authRouter.route('/login').post(loginUserHandler)
authRouter.route('/refreshToken').get(refreshTokenHandler)
authRouter.route('/logout').post(logoutMeHandler)
authRouter.route('/forgotPassword').post(forgotPasswordHandler)
authRouter.route('/updatePassword').post(protectHandler, userRolesHandler('user'), updatePasswordHandler)
authRouter.route('/resetPassword/:resetToken').post(checkResetTokenHandler).patch(resetPasswordHandler)

export default authRouter
