export const sendResponse = (statusCode, body) => {
	return {
		statusCode,
		body: JSON.stringify(body),
	};
};
