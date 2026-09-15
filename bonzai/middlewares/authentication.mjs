import jwt from "jsonwebtoken";
import createError from "http-errors";

export const authenticate = () => ({
	before: (handler) => {
		const authHeader =
			handler.event.headers?.authorization || handler.event.headers?.Authorization;

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			throw createError(401, "Missing or invalid Authorization header");
		}

		const token = authHeader.split(" ")[1];

		try {
			handler.event.user = jwt.verify(token, process.env.JWT_SECRET);
		} catch (error) {
			throw createError(401, "Invalid or expired token");
		}
	},
});
