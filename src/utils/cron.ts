import cron from 'node-cron'
import axios, { AxiosError } from 'axios'

const backendUrl = `${process.env.API_DOMAIN}/keep-alive`

const job = cron.schedule('*/14 * * * *', async () => {
	try {
		const response = await axios.get(backendUrl)
		if (response.status === 200) console.log('Server is kept alive')
	} catch (error) {
		if (error instanceof AxiosError) {
			console.error('Error during keep-alive request:', error.response?.status)
		}
	}
})

export default job
