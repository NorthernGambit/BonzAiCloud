import { z } from "zod";

export const updateBookingSchema = z
	.object({
		checkIn: z.iso.date().optional(),
		checkOut: z.iso.date().optional(),
		guests: z.number().int().min(1).optional(),
		rooms: z.array(z.string().min(1)).min(1).optional(),
	})
	.refine(
		(data) => !data.checkIn || !data.checkOut || data.checkOut > data.checkIn,
		{
			message: "checkOut must be after checkIn",
			path: ["checkOut"],
		},
	)

    .refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided to update the booking",
	});
