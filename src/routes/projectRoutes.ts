import express from 'express'

import { protectHandler, userRolesHandler } from '../controllers/authController'
import {
	createMyProjectData,
	getMyProjectsData,
	updateMyProjectData,
	deleteMyProjectData,
	getTechnologiesData,
	uploadProjectImage,
	resizeProjectImage,
} from '../controllers/projectController'

// Order matters. Leave the routes with dynamic parameters at the bottom
const projectRouter = express.Router()

projectRouter.route('/currentUser/technologies').get(protectHandler, getTechnologiesData)

projectRouter
	.route('/currentUser')
	.get(protectHandler, userRolesHandler('user', 'tester'), getMyProjectsData)
	.post(protectHandler, userRolesHandler('user', 'tester'), uploadProjectImage, resizeProjectImage, createMyProjectData)

projectRouter
	.route('/currentUser/:projectId')
	.put(protectHandler, userRolesHandler('user', 'tester'), uploadProjectImage, resizeProjectImage, updateMyProjectData)
	.delete(protectHandler, userRolesHandler('user'), deleteMyProjectData)

export default projectRouter
