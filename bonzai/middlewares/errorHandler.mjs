import { sendResponse } from "../responses/index.mjs";

export const errorHandler = () => ({
	onError: (handler) => {
		const error = handler.error;
		console.error("ERROR:", error);

		handler.response = sendResponse(error.statusCode || 500, {
			message: error.message || "Internal Server Error!",
		});
	},
});
