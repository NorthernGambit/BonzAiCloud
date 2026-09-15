import { db } from "./db.mjs";

const TABLE_NAME = process.env.TABLE_NAME;

export const getUserByEmail = async (email) => {
	const result = await db.query({
		TableName: TABLE_NAME,
		IndexName: "GSI1",
		KeyConditionExpression: "GSI1PK = :pk",
		ExpressionAttributeValues: { ":pk": `EMAIL#${email}` },
	});
	return result.Items?.[0];
};

export const createUser = async (user) => {
	await db.put({
		TableName: TABLE_NAME,
		Item: {
			PK: `USER#${user.id}`,
			SK: `USER#${user.id}`,
			GSI1PK: `EMAIL#${user.email}`,
			GSI1SK: `EMAIL#${user.email}`,
			...user,
		},
		ConditionExpression: "attribute_not_exists(PK)",
	});
};
