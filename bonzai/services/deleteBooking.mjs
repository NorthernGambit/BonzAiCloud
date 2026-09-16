import createHttpError from "http-errors";
import { db } from "./db.mjs";
import { GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

export const deleteBooking = async (bookingId, userName) => {
	const getCommand = new GetCommand({
		TableName: "bonz-ai",
		Key: {
			PK: `BOOKINGS#${bookingId}`,
			SK: "DETAILS",
		},
	});
	const { Item: existing } = await db.send(getCommand);

	if (!existing) {
		throw createHttpError(404, "Booking not found");
	}

	if (existing.GSI1PK !== `USER#${userName}`) {
		throw createHttpError(403, "You do not have access to this booking");
	}

	const deleteCommand = new DeleteCommand({
		TableName: "bonz-ai",
		Key: {
			PK: `BOOKINGS#${bookingId}`,
			SK: "DETAILS",
		},
	});
	await db.send(deleteCommand);

	for (const room of existing.rooms) {
		const deleteHelperCommand = new DeleteCommand({
			TableName: "bonz-ai",
			Key: {
				PK: room.SK,
				SK: `BOOKINGS#${existing.checkIn}`,
			},
		});
		await db.send(deleteHelperCommand);
	}

	return { bookingId };
};
