import { QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { db } from './db.mjs';

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
