import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import createError from "http-errors";
import { randomUUID } from "node:crypto";
import { validateBody } from "../../../middlewares/validation.mjs";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { sendResponse } from "../../../responses/index.mjs";
import { registerSchema } from "./schema.mjs";
import { getUserByEmail, createUser } from "../../../services/userService.mjs";
import { hashPassword } from "../../../utils/auth.mjs";

const registerHandler = async (event) => {
	const { email, password, name } = event.body;

	const existing = await getUserByEmail(email);
	if (existing) {
		throw createError(409, "A user with this email already exists");
	}

	const passwordHash = await hashPassword(password);
	const user = {
		id: randomUUID(),
		email,
		name,
		passwordHash,
		createdAt: new Date().toISOString(),
	};

	await createUser(user);

	return sendResponse(201, {
		id: user.id,
		email: user.email,
		name: user.name,
	});
};

export const handler = middy(registerHandler)
	.use(httpJsonBodyParser())
	.use(validateBody(registerSchema))
	.use(errorHandler());
