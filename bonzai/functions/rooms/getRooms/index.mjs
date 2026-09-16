import middy from '@middy/core';
import { getRooms, getAvailableRooms } from '../../../services/rooms.mjs';
import { sendResponse } from '../../../responses/index.mjs';
import { errorHandler } from '../../../middlewares/errorHandler.mjs';

const isValidDate = (value) => {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return false;
	}

	const date = new Date(`${value}T00:00:00.000Z`);

	return (
		!Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
	);
};

const getRoomsHandler = async (event) => {
	const { startDate, endDate, type } = event.queryStringParameters ?? {};

	const allowedTypes = ['single', 'double', 'suite'];

	if (type !== undefined && !allowedTypes.includes(type)) {
		return sendResponse(400, {
			message: 'type must be single, double or suite',
		});
	}

	if (
		(startDate !== undefined && endDate === undefined) ||
		(startDate === undefined && endDate !== undefined)
	) {
		return sendResponse(400, {
			message: 'Both startDate and endDate are required',
		});
	}

	if (
		startDate !== undefined &&
		endDate !== undefined &&
		(!isValidDate(startDate) || !isValidDate(endDate))
	) {
		return sendResponse(400, {
			message: 'Dates must be valid dates in YYY-MM-DD format',
		});
	}

	if (
		startDate !== undefined &&
		endDate !== undefined &&
		endDate <= startDate
	) {
		return sendResponse(400, {
			message: 'endDate must be after startDate',
		});
	}

	const rooms =
		startDate !== undefined && endDate !== undefined
			? await getAvailableRooms(startDate, endDate)
			: await getRooms();

	const filteredRooms =
		type !== undefined ? rooms.filter((room) => room.type === type) : rooms;

	return sendResponse(200, filteredRooms);
};

export const handler = middy(getRoomsHandler).use(errorHandler());
