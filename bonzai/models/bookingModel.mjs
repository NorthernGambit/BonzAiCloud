import { z } from 'zod';

export const createBookingSchema = z
	.object({
		checkIn: z.iso.date(),
		checkOut: z.iso.date(),
		guests: z.number().int().min(1),
		rooms: z.array(z.string().min(1)).min(1),
	})
	.refine((data) => data.checkOut > data.checkIn, {
		message: 'checkOut must be after checkIn',
		path: ['checkOut'],
	});
