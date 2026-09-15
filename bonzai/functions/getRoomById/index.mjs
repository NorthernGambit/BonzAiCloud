import middy from '@middy/core';
import createError from 'http-errors';
import { getRoomById } from '../../services/rooms.mjs';
import { sendResponse } from '../../responses/index.mjs';
import { errorHandler } from '../../middlewares/errorHandler.mjs';

const getRoomByIdHandler = async (event) => {
	const id = event.pathParameters?.id;

	if (!id) {
		throw createError(400, 'Rums-ID saknas');
	}

	const room = await getRoomById(id);

	if (!room) {
		throw createError(404, 'Rummet hittades inte');
	}

	return sendResponse(200, room);
};

export const handler = middy(getRoomByIdHandler).use(errorHandler());
