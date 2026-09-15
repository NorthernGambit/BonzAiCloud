import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import createError from "http-errors";
import { validateBody } from "../../../middlewares/validation.mjs";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { sendResponse } from "../../../responses/index.mjs";
import { loginSchema } from "./schema.mjs";
import { getUserByEmail } from "../../../services/userService.mjs";
import { comparePassword, generateToken } from "../../../utils/auth.mjs";

const loginHandler = async (event) => {
	const { email, password } = event.body;

	const user = await getUserByEmail(email);
	if (!user) {
		throw createError(401, "Invalid email or password");
	}

	const isValid = await comparePassword(password, user.passwordHash);
	if (!isValid) {
		throw createError(401, "Invalid email or password");
	}

	const token = generateToken({ sub: user.id, email: user.email });

	return sendResponse(200, {
		token,
		user: { id: user.id, email: user.email, name: user.name },
	});
};

export const handler = middy(loginHandler)
	.use(httpJsonBodyParser())
	.use(validateBody(loginSchema))
	.use(errorHandler());
