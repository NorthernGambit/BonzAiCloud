import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = 10;

export const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

export const comparePassword = (password, hash) => bcrypt.compare(password, hash);

export const generateToken = (payload) =>
	jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
