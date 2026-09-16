import middy from "@middy/core";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { sendResponse } from "../../../responses/index.mjs";
import { getBookingById } from "../../../services/bookings.mjs";
import { authenticate } from "../../../middlewares/authentication.mjs";
import createHttpError from "http-errors";

export const handler = middy(async (event) => {
	const id = event.pathParameters?.id;

	if (!id) {
		throw createHttpError(400, "Booking-ID saknas");
	}

	const booking = await getBookingById(id, event.user);

	return sendResponse(200, {
		message: "Booking on the specified ID succesfully retrieved!",
		booking,
	});
})
	.use(authenticate())
	.use(errorHandler());
