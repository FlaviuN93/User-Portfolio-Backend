import express from 'express'

import { protectHandler, userRolesHandler } from '../controllers/authController'
import {
	createMyProjectData,
	getMyProjectsData,
	updateMyProjectData,
	deleteMyProjectData,
	getMyProjectData,
	getTechnologiesData,
	uploadProjectImage,
	resizeProjectImage,
} from '../controllers/projectController'

const projectRouter = express.Router()

projectRouter.route('/currentUser/technologies').get(protectHandler, getTechnologiesData)

projectRouter
	.route('/currentUser')
	.get(protectHandler, userRolesHandler('user', 'tester'), getMyProjectsData)
	.post(protectHandler, userRolesHandler('user', 'tester'), uploadProjectImage, resizeProjectImage, createMyProjectData)

projectRouter
	.route('/currentUser/:projectId')
	.get(protectHandler, userRolesHandler('user', 'tester'), getMyProjectData)
	.put(protectHandler, userRolesHandler('user', 'tester'), uploadProjectImage, resizeProjectImage, updateMyProjectData)
	.delete(protectHandler, userRolesHandler('user'), deleteMyProjectData)

export default projectRouter
