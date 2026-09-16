import middy from "@middy/core";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { sendResponse } from "../../../responses/index.mjs";
import { getAllBookings } from "../../../services/bookings.mjs";
import { authenticate } from "../../../middlewares/authentication.mjs";

export const handler = middy(async (event) => {
	const bookings = await getAllBookings(event.user);

	return sendResponse(200, {
		message: "All bookings successfully retrieved!",
		bookings,
	});
})
	.use(authenticate())
	.use(errorHandler());
