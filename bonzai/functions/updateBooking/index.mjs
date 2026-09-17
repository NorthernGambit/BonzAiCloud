import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { errorHandler } from "../../middlewares/errorHandler.mjs";
import { sendResponse } from "../../responses/index.mjs";
import { validateBody } from "../../middlewares/validation.mjs";
import { updateBookingSchema } from "../../models/updateBookingModel.mjs";
import { updateBooking } from "../../services/updateBooking.mjs";
import { authenticate } from "../../middlewares/authentication.mjs";

export const handler = middy(async (event) => {
	const bookingId = event.pathParameters?.id;

	const booking = await updateBooking(
		bookingId,
		event.body,
		event.user.email,
	);

	return sendResponse(200, {
		message: "Booking successfully updated!",
		booking,
	});
})
	.use(httpJsonBodyParser())
	.use(authenticate())
	.use(validateBody(updateBookingSchema))
	.use(errorHandler());
