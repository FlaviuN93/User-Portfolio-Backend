import express, { NextFunction, Request, Response } from 'express'
import 'dotenv/config' // This import should not be moved from here
import cors from 'cors'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import bodyParser from 'body-parser'
import projectRouter from './routes/projectRoutes'
import userRouter from './routes/userRoutes'
import authRouter from './routes/authRoutes'
import AppError from './utils/appError'
import { globalErrorHandler } from './utils/errorFunctions'
import cookieParser from 'cookie-parser'
import job from './utils/cron'

const app = express()

const limiter = rateLimit({
	//Remember to change later
	max: 1000,
	windowMs: 60 * 60 * 1000,
	message: new AppError(429),
	standardHeaders: true,
	legacyHeaders: false,
})

if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'))
}

// Cookie Parser
app.use(cookieParser())

app.use(bodyParser.json({ limit: '2mb' }))
app.use(bodyParser.urlencoded({ extended: true }))
// Set security HTTP headers
app.use(helmet())

// Limits requests from users to the API
app.use('/api', limiter)

app.use(cors({ origin: process.env.VITE_APP_LOCAL_DOMAIN, credentials: true }))

app.get('/api/keep-alive', (req: Request, res: Response) => {
	res.status(200).send('Server is active')
})

app.use('/api/projects', projectRouter)
app.use('/api/users', userRouter)
app.use('/api/auth', authRouter)

job.start()
app.all('*', (req: Request, res: Response, next: NextFunction) => {
	next(new AppError(404, 'Not Found'))
})

app.use(globalErrorHandler)
export default app
