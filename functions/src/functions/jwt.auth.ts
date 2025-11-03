import "dotenv/config";
import jwt from "jsonwebtoken";

/**
 * Generates a JWT token for the given username.
 * @param {string} username The username to include in the token.
 * @return {Promise<string>} The generated JWT token.
 */
export async function generateToken(username: string): Promise<string> {
    const secret = process.env.JWT_SECRET_KEY;
    if (!secret || secret.trim() === "") {
        console.log("JWT secret key is not set in environment variables!");
        return "";
    }

    const data = {username: username};
    return jwt.sign(data, secret);
}

/**
 * Verifies the JWT token from the request session.
 * @param {any} req The request object containing the session.
 * @return {Promise<string | undefined>} The username if the token is valid,
 * otherwise undefined.
 */
export async function verifyToken(req: any): Promise<string | undefined> {
    const secret = process.env.JWT_SECRET_KEY;
    if (!secret || secret.trim() === "") {
        console.log("JWT secret key is not set in environment variables!");
        return "";
    }

    const header = process.env.TOKEN_HEADER_KEY;
    if (!header || header.trim() === "") {
        console.log("Token header key is not set in environment variables!");
        return "";
    }

    try {
        const token = req.session.jwt;

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

/**
 * Checks if the request is made by a developer.
 * @param {any} req The request object containing the session.
 * @return {Promise<boolean | undefined>} True if the user is a developer,
 * false otherwise.
 */
export async function verifyDeveloper(req: any): Promise<boolean | undefined> {
    // TODO: Come up with a more secure and sustainable developer verify method.
    return await verifyToken(req) === process.env.DEV_USERNAME;
}
