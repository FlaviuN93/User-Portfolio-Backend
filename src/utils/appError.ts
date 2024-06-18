export const errorMessage: { [key: number]: string } = {
	400: `Whoops! It looks like there might be a mistake with your request. Check your information and try again.`,
	401: `You don't seem to have permission for this action. Check your credentials and try again.`,
	403: `Looks like you're trying to peek behind the curtain! This resource is off-limits for now.`,
	404: `The item you requested does not wish to be found.Try searching for something else?`,
	406: `Incompatible info. Check request format and try again.`,
	409: `Something's conflicting with your request.This could be due a faulty value.Double check your information try again.`,
	413: `The object exceeded the maximum allowed size`,
	415: `Invalid file type`,
	429: `Slow down a bit! You're making too many requests at once. Try again in an hour.`,
	500: `Something went wrong on our end. We're working on a fix, please try again later.`,
}

export const getSuccessMessage = (statusCode: number, statusText: string[]): string | undefined => {
	if (statusCode === 200)
		return statusText.length > 0 ? `Your ${statusText[0]} request was successful. ${statusText[1]}!` : 'Your request was successful!'

	if (statusCode === 201) return `The data you entered is correct.The ${statusText[0]} has been ${statusText[1]} successfully!`
}

class AppError extends Error {
	public isClientError: boolean
	constructor(public statusCode: number, message?: string) {
		super(message ? message : errorMessage[statusCode])
		this.isClientError = true
		Error.captureStackTrace(this, this.constructor)
	}
}

export default AppError
