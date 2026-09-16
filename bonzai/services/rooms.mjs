import { QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { db } from './db.mjs';
import { roomsArrayBookingOverlap } from './bookings.mjs';

export const getRooms = async () => {
	const result = await db.send(
		new QueryCommand({
			TableName: 'bonz-ai',
			KeyConditionExpression: 'PK = :pk',
			ExpressionAttributeValues: {
				':pk': 'ROOM',
			},
		}),
	);

	return result.Items;
};

export const getAvailableRooms = async (startDate, endDate) => {
	const rooms = await getRooms();
	const availableRooms = [];

	for (const room of rooms) {
		const result = await roomsArrayBookingOverlap([room], startDate, endDate);

		if (result.success) {
			availableRooms.push(room);
		}
	}

	return availableRooms;
};

export const getRoomById = async (id) => {
	const result = await db.send(
		new GetCommand({
			TableName: 'bonz-ai',
			Key: {
				PK: 'ROOM',
				SK: `ROOM#${id}`,
			},
		}),
	);

	return result.Item;
};
