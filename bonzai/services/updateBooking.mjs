import createHttpError from "http-errors";
import { db } from "./db.mjs";
import {
	GetCommand,
	BatchGetCommand,
	PutCommand,
	QueryCommand,
	DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const getRoomsById = async (roomIds) => {
	const keys = roomIds.map((id) => ({
		PK: "ROOM",
		SK: `ROOM#${id}`,
	}));

	const command = new BatchGetCommand({
		RequestItems: {
			["bonz-ai"]: {
				Keys: keys,
			},
		},
	});

	const response = await db.send(command);
	return response.Responses?.["bonz-ai"] || [];
};

const calcDays = (checkIn, checkOut) => {
	const start = new Date(checkIn);
	const end = new Date(checkOut);
	const diffInMs = end - start;
	return diffInMs / (1000 * 60 * 60 * 24);
};

const roomsBookingOverlapExcluding = async (
	rooms,
	checkIn,
	checkOut,
	excludeBookingId,
) => {
	for (const room of rooms) {
		const command = new QueryCommand({
			TableName: "bonz-ai",
			KeyConditionExpression: "PK = :roomId AND SK < :newCheckOut",
			FilterExpression: "checkOut > :newCheckIn",
			ExpressionAttributeValues: {
				":roomId": room.SK,
				":newCheckOut": `BOOKINGS#${checkOut}`,
				":newCheckIn": checkIn,
			},
		});
		const response = await db.send(command);

		const conflicts = (response.Items || []).filter(
			(item) => item.bookingId !== excludeBookingId,
		);

		if (conflicts.length > 0) {
			return { success: false, occupiedRoom: room.SK };
		}
	}
	return { success: true };
};

export const updateBooking = async (bookingId, body, userEmail) => {
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

	if (existing.GSI1PK !== `USER#${userEmail}`) {
		throw createHttpError(403, "You do not have access to this booking");
	}

	const checkIn = body.checkIn ?? existing.checkIn;
	const checkOut = body.checkOut ?? existing.checkOut;
	const guests = body.guests ?? existing.guests;
	const roomIds =
		body.rooms ??
		existing.rooms.map((room) => room.SK.replace("ROOM#", ""));

	const today = new Date().toISOString().split("T")[0];
	if (checkIn < today) {
		throw createHttpError(400, "Check-in date cannot be in the past");
	}

	const rooms = await getRoomsById(roomIds);

	if (rooms.length !== roomIds.length) {
		throw createHttpError(400, "Invalid room id's provided");
	}

	if (guests > rooms.reduce((sum, room) => sum + room.maxGuests, 0)) {
		throw createHttpError(400, "Too many guests for the room/s");
	}

	const overlapCheck = await roomsBookingOverlapExcluding(
		rooms,
		checkIn,
		checkOut,
		bookingId,
	);

	if (!overlapCheck.success) {
		throw createHttpError(
			409,
			`Room with roomID ${overlapCheck.occupiedRoom.split("#")[1]} is already booked in this date range!`,
		);
	}

	const nights = calcDays(checkIn, checkOut);
	const pricePerNight = rooms.reduce((sum, room) => sum + room.price, 0);
	const totalPrice = pricePerNight * nights;

	const putCommand = new PutCommand({
		TableName: "bonz-ai",
		Item: {
			PK: `BOOKINGS#${bookingId}`,
			SK: "DETAILS",
			GSI1PK: `USER#${userEmail}`,
			GSI1SK: `BOOKINGS#${checkIn}`,
			checkIn,
			checkOut,
			guests,
			totalPrice,
			rooms,
		},
	});
	await db.send(putCommand);

	for (const oldRoom of existing.rooms) {
		const deleteCommand = new DeleteCommand({
			TableName: "bonz-ai",
			Key: {
				PK: oldRoom.SK,
				SK: `BOOKINGS#${existing.checkIn}`,
			},
		});
		await db.send(deleteCommand);
	}

	for (const room of rooms) {
		const putHelperCommand = new PutCommand({
			TableName: "bonz-ai",
			Item: {
				PK: room.SK,
				SK: `BOOKINGS#${checkIn}`,
				checkIn,
				checkOut,
				bookingId,
			},
		});
		await db.send(putHelperCommand);
	}

	return {
		bookingId,
		checkIn,
		checkOut,
		guests,
		rooms: roomIds,
		nights,
		totalPrice,
	};
};
