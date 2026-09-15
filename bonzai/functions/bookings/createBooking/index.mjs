import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { sendResponse } from "../../../responses/index.mjs";
import { validateBody } from "../../../middlewares/validation.mjs";
import { createBookingSchema } from "../../../models/bookingModel.mjs";
import { createBooking } from "../../../services/bookings.mjs";

export const handler = middy(async (event) => {
	const booking = await createBooking(event.body);

	return sendResponse(201, {
		message: "Booking successfully made!",
		booking,
	});
})
	.use(httpJsonBodyParser)
	.use(validateBody(createBookingSchema))
	.use(errorHandler());
