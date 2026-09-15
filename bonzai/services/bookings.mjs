import createHttpError from "http-errors";
import { sendResponse } from "../responses/index.mjs";
import { db } from "./db.mjs";
import {
	GetCommand,
	BatchGetCommand,
	PutCommand,
	QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "node:crypto";

export const createBooking = async (body) => {
	// can't book room in the past
	const today = new Date().toISOString().split("T")[0];
	if (body.checkIn < today) {
		throw createHttpError(400, "Check-in date cannot be in the past");
	}

	// get all rooms
	const rooms = await getRoomsById(body);

	// if the getRoomsById doesnt return the same amount of array items that means that one of the id's doesnt match
	if (rooms.length !== body.rooms.length) {
		throw createHttpError(400, "Invalid room id's provided");
	}

	// checking that the number of guests will fit the room/s
	if (body.guests > rooms.reduce((sum, room) => sum + room.maxGuests, 0)) {
		throw createHttpError(400, "Too many guests for the room/s");
	}

	// date overlap check to see if if the room/s are already booked within the date range
	const overlapCheck = await roomsArrayBookingOverlap(
		rooms,
		body.checkIn,
		body.checkOut,
	);

	if (!overlapCheck.success) {
		throw createHttpError(
			409,
			`${overlapCheck.occupiedRoom} is already booked in this date range!`,
		);
	}

	const bookingId = randomUUID().slice(0, 6);
	const nights = calcDays(body.checkIn, body.checkOut);
	const pricePerNight = rooms.reduce((sum, room) => {
		return sum + room.price;
	}, 0);
	const totalPrice = pricePerNight * nights;

	let command = new PutCommand({
		TableName: "bonz-ai",
		Item: {
			PK: `BOOKINGS#${bookingId}`,
			SK: "DETAILS",
			GSI1PK: `USER#${"testUser"}`,
			GSI1SK: `BOOKINGS#${body.checkIn}`,
			checkIn: body.checkIn,
			checkOut: body.checkOut,
			guests: body.guests,
			totalPrice,
			rooms,
		},
	});
	await db.send(command);

	// helper db entries that lets us queery for a specific room, used in overlap check
	for (let room of rooms) {
		const command = new PutCommand({
			TableName: "bonz-ai",
			Item: {
				PK: room.SK,
				SK: `BOOKINGS#${body.checkIn}`,
				checkIn: body.checkIn,
				checkOut: body.checkOut,
				bookingId,
			},
		});

		await db.send(command);
	}

	return {
		bookingId,
		checkIn: body.checkIn,
		checkOut: body.checkOut,
		rooms: body.rooms,
		nights,
		totalPrice,
	};
};

export const roomsArrayBookingOverlap = async (rooms, checkIn, checkOut) => {
	for (const room of rooms) {
		console.log("DEBUG VARIABLES:", {
			roomId: room.SK,
			checkIn: checkIn,
			isCheckInAString: typeof checkIn === "string",
		});
		const command = new QueryCommand({
			TableName: "bonz-ai",
			// first we filter for the specfic booked room pk's "ROOM#203", then we filter for any bookings that
			// starts before our current checkOut date
			KeyConditionExpression: "PK = :roomId AND SK < :newCheckOut",
			// now we filter for any bookings the ends after our current checkIn date
			// which means if we get any hits at this point we have a booking overlap
			FilterExpression: "checkOut > :newCheckIn",
			ExpressionAttributeValues: {
				":roomId": room.SK,
				":newCheckOut": `BOOKINGS#${checkOut}`,
				":newCheckIn": checkIn,
			},
		});
		const response = await db.send(command);

		if (response.Items && response.Items.length > 0) {
			return { success: false, occupiedRoom: room.SK };
		}
	}
	return { success: true };
};

const getRoomsById = async (body) => {
	const keys = body.rooms.map((id) => ({
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

	const days = diffInMs / (1000 * 60 * 60 * 24);

	return days;
};
