import bcrypt from "bcrypt";
import {FastifyReply} from "fastify";

import {sendEmail} from "../functions/email.config";
import {generateToken, verifyToken} from "../functions/jwt.auth";
import {verifyUsername, verifyPassword, verifyEmail, verifyTitle, verifyDescription} from "../functions/regex.checkers";
import {db} from "../lib/instance";
import {removeImageFromBucket, submitImageToBucket} from "../functions/image.handler";

/**
 * Checks if an account with the given username exists and returns the user.
 * @param {string} username The username to check.
 * @return {Promise<any>} The user document if found, otherwise null.
 */
async function accountCheck(username: string): Promise<any> {
    const snapshot = await db.collection("users").where("username", "==", username).limit(1).get();
    if (snapshot.empty) return null;
    return snapshot.docs[0];
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

        if (await accountCheck(username) != null) return res.code(400).send({error: "Username taken!"});

        try {
            password = bcrypt.hashSync(password, 8);
            const verifyKey = crypto.randomUUID().toString();

            await db.collection("users").add({
                username: username,
                password: password,
                newPassword: password,
                email: email,
                newEmail: email,
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
                email, "Verify your account",
                `Verify your account: http://127.0.0.1:5001/forum2-1134f/us-central1/app/user/verify/${verifyKey}`,
            );
            return res.code(200).send({registered: true});
        } catch (error) {
            return res.code(500).send({error: "Internal server error! Please try again later!"});
        }
    });

    fastify.get("/verify/:key", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        const userCheck: any = await db.collection("users").where("verifyKey", "==", req.params.key).limit(1).get();

        if (!userCheck.empty) {
            const userDoc = userCheck.docs[0];
            const userRef = db.collection("users").doc(userDoc.id);

            req.session.jwt = generateToken(userDoc.data().username);

            await userRef.update({
                password: userDoc.data().newPassword,
                email: userDoc.data().newEmail,
                verified: true,
                verifyKey: "",
            });

            return res.code(200).send({verified: true});
        } else {
            return res.code(400).send({error: "Invalid verification key!"});
        }
    });

    fastify.post("/login", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        const {username, password} = req.body;

        if (!verifyUsername(username)) return res.code(400).send({error: "Invalid username!"});
        if (!verifyPassword(password)) return res.code(400).send({error: "Invalid password!"});

        const user = await accountCheck(username);
        if (user === null) return res.code(400).send({error: "Invalid username!"});
        if (!user.data().verified) return res.code(400).send({error: "Account not verified!"});

        if (bcrypt.compareSync(password, user.data().password)) {
            req.session.jwt = await generateToken(username);
            return res.code(200).send({loggedIn: true});
        } else return res.code(400).send({error: "Incorrect password!"});
    });

    fastify.get("/check", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        const user: any = await accountCheck(await verifyToken(req) || "");
        if (user === null) return res.code(200).send({loggedIn: false});
        return res.code(200).send({loggedIn: true});
    });

    fastify.get("/logout",
        async (req: any, res: FastifyReply): Promise<FastifyReply> => {
            req.session.destroy();
            return res.code(200).send({loggedIn: false});
        }
    );

    fastify.post("/username", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        if (!verifyUsername(req.body.username)) return res.code(400).send({error: "Invalid username!"});

        const user: any = await accountCheck(await verifyToken(req) || "");
        if (user === null) return res.code(400).send({error: "User not found!"});

        await db.collection("users").doc(user.id).update({username: req.body.username});

        await sendEmail(
            user.data().email, "Username Changed",
            "Your username has been changed to " + req.body.username
        );

        return res.code(200).send({updated: true});
    });

    fastify.post("/password", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        if (!verifyPassword(req.body.password)) return res.code(400).send({error: "Invalid password!"});

        const user: any = await accountCheck(await verifyToken(req) || "");
        if (user === null) return res.code(400).send({error: "User not found!"});

        const verifyKey = crypto.randomUUID().toString();

        await db.collection("users").doc(user.id).update({
            newPassword: bcrypt.hashSync(req.body.password, 8),
            newEmail: user.data().email,
            verifyKey: verifyKey,
        });

        await sendEmail(
            user.data().email, "Password Reset Request",
            "A request has been made to reset your password. Click the link to verify:" +
            `http://127.0.0.1:5001/forum2-1134f/us-central1/app/verify/${verifyKey}`,
        );

        return res.code(200).send({updated: "pending"});
    });

    fastify.post("/email", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        if (!verifyEmail(req.body.email)) return res.code(400).send({error: "Invalid email!"});

        const user: any = await accountCheck(await verifyToken(req) || "");
        if (user === null) return res.code(400).send({error: "User not found!"});

        const verifyKey = crypto.randomUUID().toString();

        await db.collection("users").doc(user.id).update({
            newPassword: user.data().password,
            newEmail: req.body.email,
            verifyKey: verifyKey,
        });

        await sendEmail(
            user.data().email, "Email Change Request",
            "A request has been made to change your email. Click the link to verify:" +
            `http://127.0.0.1:5001/forum2-1134f/us-central1/app/verify/${verifyKey}`,
        );

        return res.code(200).send({updated: "pending"});
    });

    fastify.post("/profilePic", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        const user: any = await accountCheck(await verifyToken(req) || "");
        if (user === null) return res.code(400).send({error: "User not found!"});

        const url = submitImageToBucket(await req.body.image, "Profile");

        if (user.profilePic != "") await removeImageFromBucket(user.profilePic);
        await db.collection("users").doc(user.id).update({profilePic: url});

        return res.code(200).send({updated: true});
    });

    fastify.post("/title", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        if (!verifyTitle(req.body.title)) return res.code(400).send({error: "Invalid title!"});

        const user: any = await accountCheck(await verifyToken(req) || "");
        if (user === null) return res.code(400).send({error: "User not found!"});

        await db.collection("users").doc(user.id).update({title: req.body.title});

        return res.code(200).send({updated: true});
    });

    fastify.post("/description", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        if (!verifyDescription(req.body.description)) return res.code(400).send({error: "Invalid description!"});

        const user: any = await accountCheck(await verifyToken(req) || "");
        if (user === null) return res.code(400).send({error: "User not found!"});

        await db.collection("users").doc(user.id).update({description: req.body.description});

        return res.code(200).send({updated: true});
    });
}
