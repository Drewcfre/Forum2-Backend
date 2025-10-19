import bcrypt from "bcrypt";
import {FastifyReply} from "fastify";

import {sendEmail} from "../functions/email.config";
import {generateToken, verifyToken} from "../functions/jwt.auth";
import {verifyUsername, verifyPassword, verifyEmail, verifyTitle, verifyDescription} from "../functions/regex.checkers";
import {db} from "../lib/instance";

/**
 * Checks if an account with the given username exists and returns the user.
 * @param {string} username The username to check.
 * @return {Promise<any>} The user document if found, otherwise null.
 */
async function accountCheck(username: string): Promise<any> {
    return await db.collection("users").where("username", "==", username).limit(1).get();
}

/**
 * Routes for user authentication (register, login, logout, etc.).
 * @param {any} fastify The fastify instance.
 */
export async function userAuthRoutes(fastify: any): Promise<void> {
    fastify.post("/register", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        let {username, password, email} = req.body;

        if (!verifyUsername(username)) return res.code(400).send({error: "Invalid username!"});
        if (!verifyPassword(password)) return res.code(400).send({error: "Invalid password!"});
        if (!verifyEmail(email)) return res.code(400).send({error: "Invalid email!"});

        if (await accountCheck(username)) return res.code(400).send({error: "Username taken!"});

        try {
            password = bcrypt.hashSync(password, 8);
            const verifyKey = crypto.randomUUID().toString();

            await db.collection("users").add({
                username: username,
                password: password,
                email: email,
                verifyKey: verifyKey,
                verified: false,
                banned: false,
                admin: false,
                creationDate: new Date(),
                profilePic: "",
                title: "",
                description: "",
                postsRated: [],
                threadsRated: [],
            });

            await sendEmail(
                email,
                "Verify your account",
                "Please verify your account by clicking the following link: https://yourdomain.com/verify/" + verifyKey
            );
            return res.code(200).send({registered: true});
        } catch (error) {
            return res.code(500).send({
                error: "Internal server error! Please try again later!",
            });
        }
    }
    );

    fastify.get("/verify/:key",
        async (req: any, res: FastifyReply): Promise<FastifyReply> => {
            const userCheck: any = await db.collection("users")
                .where("verifyKey", "==", req.param.key).limit(1).get();

            if (userCheck.exists) {
                req.session.jwt = generateToken(userCheck.data().username);
                await db.collection("users").doc(userCheck.id).update({
                    verified: true,
                    verifyKey: "",
                });
                return res.code(200).send({verified: true});
            } else {
                return res.code(400).send({error: "Invalid verification key!"});
            }
        }
    );

    fastify.post("/login",
        async (req: any, res: FastifyReply): Promise<FastifyReply> => {
            const {username, password} = req.body;

            if (!verifyUsername(username)) {
                return res.code(400).send({error: "Invalid username!"});
            }
            if (!verifyPassword(password)) {
                return res.code(400).send({error: "Invalid password!"});
            }

            const user = await accountCheck(username);

            if (user === null) {
                return res.code(400).send({error: "Invalid username!"});
            }

            if (!user.data().verified) {
                return res.code(400).send({error: "Account not verified!"});
            }

            if (bcrypt.compareSync(password, user.data().password)) {
                req.session.jwt = generateToken(username);
                return res.code(200).send({loggedIn: true});
            } else {
                return res.code(400).send({error: "Incorrect password!"});
            }
        }
    );

    fastify.get("/logout",
        async (req: any, res: FastifyReply): Promise<FastifyReply> => {
            req.session.destroy();
            return res.code(200).send({loggedIn: false});
        }
    );

    // TODO: Add verification for changing username/email/password.
    fastify.post("/username",
        async (req: any, res: FastifyReply): Promise<FastifyReply> => {
            if (!verifyUsername(req.body.username)) {
                return res.code(400).send({error: "Invalid username!"});
            }

            const user: any = await accountCheck(await verifyToken(req) || "");
            if (user === null) return res.code(400).send({error: "User not found!"});

            await db.collection("users").doc(user.id).update({
                username: req.body.username,
            });

            await sendEmail(
                user.data().email,
                "Username Changed",
                "Your username has been changed to " + req.body.username
            );

            return res.code(200).send({updated: true});
        }
    );

    fastify.post("/password",
        async (req: any, res: FastifyReply): Promise<FastifyReply> => {
            if (!verifyPassword(req.body.password)) {
                return res.code(400).send({error: "Invalid password!"});
            }

            const user: any = await accountCheck(await verifyToken(req) || "");
            if (user === null) return res.code(400).send({error: "User not found!"});

            await db.collection("users").doc(user.id).update({
                username: req.body.username,
            });

            await sendEmail(
                user.data().email,
                "Password Changed",
                "Your username has been changed to " + req.body.password
            );

            return res.code(200).send({updated: true});
        }
    );

    fastify.post("/email",
        async (req: any, res: FastifyReply): Promise<FastifyReply> => {
            if (!verifyEmail(req.body.email)) {
                return res.code(400).send({error: "Invalid email!"});
            }

            const user: any = await accountCheck(await verifyToken(req) || "");
            if (user === null) return res.code(400).send({error: "User not found!"});

            const oldEmail = user.data().email;

            await db.collection("users").doc(user.id).update({
                email: req.body.email,
            });

            await sendEmail(
                oldEmail,
                "Email Changed",
                "Your email has been changed to " + req.body.email
            );

            return res.code(200).send({updated: true});
        }
    );

    // TODO: Add image upload and validation.
    fastify.post("/profilePic",
        async (req: any, res: FastifyReply): Promise<FastifyReply> => {
            const user: any = await accountCheck(await verifyToken(req) || "");
            if (user === null) return res.code(400).send({error: "User not found!"});

            await db.collection("users").doc(user.id).update({
                profilePic: req.body.profilePic,
            });

            return res.code(200).send({updated: true});
        }
    );

    fastify.post("/title",
        async (req: any, res: FastifyReply): Promise<FastifyReply> => {
            if (!verifyTitle(req.body.title)) {
                return res.code(400).send({error: "Invalid title!"});
            }

            const user: any = await accountCheck(await verifyToken(req) || "");
            if (user === null) return res.code(400).send({error: "User not found!"});

            await db.collection("users").doc(user.id).update({
                title: req.body.title,
            });

            return res.code(200).send({updated: true});
        }
    );

    fastify.post("/description",
        async (req: any, res: FastifyReply): Promise<FastifyReply> => {
            if (!verifyDescription(req.body.description)) {
                return res.code(400).send({error: "Invalid description!"});
            }

            const user: any = await accountCheck(await verifyToken(req) || "");
            if (user === null) return res.code(400).send({error: "User not found!"});

            await db.collection("users").doc(user.id).update({
                description: req.body.description,
            });

            return res.code(200).send({updated: true});
        }
    );
}
