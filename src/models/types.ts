import { JwtPayload } from 'jsonwebtoken'

export interface User {
	coverURL: string
	avatarURL: string
	email: string
	fullName: string
	jobTitle: string
	linkedin: string
	bio: string
}

export type UserRoles = 'user' | 'tester'

interface Project {
	id?: number
	imageURL: string
	name: string
	demoURL: string
	repositoryURL: string
	technologies: string[]
	description: string
}

export interface UserAndProjects {
	userId?: string
	coverURL: string
	avatarURL: string
	email: string
	fullName: string
	jobTitle: string
	linkedin: string
	bio: string
	projects: Project[]
}

interface Item {
	id: number
	name: string
}

export interface IDefault {
	statusCode: number
	statusText?: string[]
	accessToken?: string
	refreshToken?: string
}

export interface IImageURL extends IDefault {
	imageURL: string
}

// User Types

export interface IUserAndProjects extends IDefault {
	userWithProjects: UserAndProjects
}

export interface IUser extends IDefault {
	user: User
}

// Project Types
export interface IProjects extends IDefault {
	projects: Project[]
}

export interface IProject extends IDefault {
	project: Project
}

export interface ITechnologies extends IDefault {
	technologies: Item[]
}

// Auth Types

export interface IRegisterUser extends IDefault {
	email: string
}

export interface TokenPayload extends JwtPayload {
	userId: number
}
