import createHttpError from "http-errors";
import { sendResponse } from "../responses/index.mjs";
import { db } from "./db.mjs";
import { GetCommand, BatchGetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "node:crypto";

export const createBooking = async (body) => {
	const roomKeys = body.rooms.map((id) => ({
		PK: "ROOM",
		SK: `ROOM#${id}`,
	}));

	const rooms = await getRoomsById(roomKeys);

	if (rooms.length !== body.rooms.length) {
		throw createHttpError(400, "Invalid room id's provided");
	}

	if (body.guests > rooms.reduce((sum, room) => sum + room.maxGuests, 0)) {
		throw createHttpError(400, "Too many guests for the room/s");
	}

	// date overlap check

	const command = new PutCommand({
		PK: `BOOKINGS#${crypto.randomUUID.slice(0, 6)}`,
		SK: "DETAILS",
		GSI1PK: `USER#${"testUser"}`,
		GSI1SK: body.checkIn,
		checkIn: body.checkIn,
		checkOut: body.checkOut,
		guests: body.guests,
	});

	return {};
};

const getRoomsById = async (keys) => {
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

const calcDays = () => {};
