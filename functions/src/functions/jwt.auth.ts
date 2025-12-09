import "dotenv/config";
import jwt from "jsonwebtoken";
import {readCookie} from "./cookie.manager";

export async function generateToken(username: string): Promise<string> {
    const secret = `${process.env.JWT_SECRET_KEY}`;
    if (!secret || secret.trim() === "") {
        console.log("JWT secret key is not set in environment variables!");
        return "";
    }

    const data = {username: username};
    return jwt.sign(data, secret);
}

export async function verifyToken(req: any): Promise<string | undefined> {
    const secret = `${process.env.JWT_SECRET_KEY}`;
    if (!secret || secret.trim() === "") {
        console.log("JWT secret key is not set in environment variables!");
        return "";
    }

    const header = `${process.env.TOKEN_HEADER_KEY}`;
    if (!header || header.trim() === "") {
        console.log("Token header key is not set in environment variables!");
        return "";
    }

    try {
        const token = readCookie("JWT", req);

        if (!token || token.trim() === "") {
            console.log("Token was not found!");
            return "";
        }

        const verified = jwt.verify(token, secret) as {username: string};
        if (verified) return verified.username;
        else return "";
    } catch (error) {
        console.error("Error verifying token: ", error);
        return "";
    }
}
