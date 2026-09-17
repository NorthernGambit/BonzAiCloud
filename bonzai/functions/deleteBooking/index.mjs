import middy from "@middy/core";
import { errorHandler } from "../../middlewares/errorHandler.mjs";
import { sendResponse } from "../../responses/index.mjs";
import { deleteBooking } from "../../services/deleteBooking.mjs";
import { authenticate } from "../../middlewares/authentication.mjs";

export const handler = middy(async (event) => {
	const bookingId = event.pathParameters?.id;

	const result = await deleteBooking(bookingId, event.user.email);

	return sendResponse(200, {
		message: "Booking successfully deleted!",
		...result,
	});
})
	.use(authenticate())
	.use(errorHandler());
