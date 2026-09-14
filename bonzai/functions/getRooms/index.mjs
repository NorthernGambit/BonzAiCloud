import middy from '@middy/core';
import { getRooms } from '../../services/rooms.mjs';
import { sendResponse } from '../../responses/index.mjs';
import { errorHandler } from '../../middlewares/errorHandler.mjs';

const getRoomsHandler = async () => {
	const rooms = await getRooms();

	return sendResponse(200, rooms);
};

export const handler = middy(getRoomsHandler).use(errorHandler());
