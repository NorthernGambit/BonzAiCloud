import { db } from "./db.mjs";

const TABLE_NAME = process.env.TABLE_NAME;

export const getUserByEmail = async (email) => {
	const result = await db.query({
		TableName: TABLE_NAME,
		KeyConditionExpression: "PK = :pk",
		ExpressionAttributeValues: { ":pk": `USER#${email}` },
	});
	return result.Items?.[0];
};

export const createUser = async (user) => {
	await db.put({
		TableName: TABLE_NAME,
		Item: {
			PK: `USER#${user.email}`,
			SK: "PROFILE",
			...user,
		},
		ConditionExpression: "attribute_not_exists(PK)",
	});
};
