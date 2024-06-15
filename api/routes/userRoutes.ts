import express from 'express'
import { protectHandler, userRolesHandler } from '../controllers/authController'
import {
	deleteMeHandler,
	deleteMyAvatarHandler,
	deleteMyCoverHandler,
	getMyUserIdHandler,
	getUserAndProjectsHandler,
	resizeAvatarImage,
	resizeCoverImage,
	updateMeHandler,
	updateMyAvatarHandler,
	updateMyCoverHandler,
	upload,
} from '../controllers/userController'

const userRouter = express.Router()

userRouter.route('/currentUser/userId').get(protectHandler, userRolesHandler('user', 'tester'), getMyUserIdHandler)
// Have to remove tester from a few routes
userRouter
	.route('/currentUser')
	.patch(protectHandler, userRolesHandler('user', 'tester'), updateMeHandler)
	.delete(protectHandler, userRolesHandler('user'), deleteMeHandler)

userRouter
	.route('/currentUser/avatarImg')
	.patch(protectHandler, userRolesHandler('user', 'tester'), upload.single('avatarFile'), resizeAvatarImage, updateMyAvatarHandler)
	.delete(protectHandler, userRolesHandler('user', 'tester'), deleteMyAvatarHandler)

userRouter
	.route('/currentUser/coverImg')
	.patch(protectHandler, userRolesHandler('user', 'tester'), upload.single('coverFile'), resizeCoverImage, updateMyCoverHandler)
	.delete(protectHandler, userRolesHandler('user', 'tester'), deleteMyCoverHandler)

userRouter.route('/projects/:userId').get(getUserAndProjectsHandler)

export default userRouter
