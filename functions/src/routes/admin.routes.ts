import {FastifyReply} from "fastify";

import {db} from "../lib/instance";
import {verifyToken} from "../functions/jwt.auth";

/**
 * Checks if the given username belongs to an admin user.
 * @param {string} username The username to check.
 * @return {Promise<boolean>} True if the user is an admin, false otherwise.
 */
async function adminCheck(username: string): Promise<boolean> {
    return await db.collection("users")
        .where("username", "==", username)
        .where("admin", "==", true)
        .get()
        .then((snapshot: any): boolean => !snapshot.empty);
}

/**
 * Routes for admin functionalities such as managing users and content as well
 * as analytics and an admin board.
 * @param {any} fastify The fastify instance.
 */
export async function adminRoutes(fastify: any): Promise<void> {
    fastify.get("/users/all", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        if (!await adminCheck(await verifyToken(req) || "")) return res.code(403).send({error: "Invalid Credentials!"});

        await db.collection("users").get().then((snapshot: any): FastifyReply => {
            const data: any[] = [];

            snapshot.forEach((doc: any): void => {
                data.push({
                    username: doc.data().get("username"),
                    title: doc.data().get("title"),
                    email: doc.data().get("email"),
                    created: doc.data().get("creationDate"),
                    verified: doc.data().get("verified"),
                    banned: doc.data().get("banned"),
                    admin: doc.data().get("admin"),
                });
            });

            return res.code(200).send(data);
        });

        return res.code(500).send({error: "An unknown error occurred!"});
    });

    fastify.put("/ban/:username", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        if (!await adminCheck(await verifyToken(req) || "")) return res.code(403).send({error: "Invalid Credentials!"});

        await db.collection("users").where("username", "==", req.params.username)
            .get().then((snapshot: any): FastifyReply => {
                if (snapshot.empty) return res.code(404).send({error: "User not found!"});

                if (snapshot.docs[0].data().banned) {
                    snapshot.docs[0].ref.update({banned: false});
                    return res.code(200).send({message: "User unbanned!"});
                } else {
                    snapshot.docs[0].ref.update({banned: true});
                    return res.code(200).send({message: "User banned!"});
                }
            });

        return res.code(500).send({error: "An unknown error occurred!"});
    });

    fastify.get("/reports", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        if (!await adminCheck(await verifyToken(req) || "")) return res.code(403).send({error: "Invalid Credentials!"});

        await db.collection("Admin").get().then((snapshot: any): FastifyReply => {
            const data = snapshot.docs.map((doc: any): any => doc.data());
            return res.code(200).send(data);
        });

        return res.code(500).send({error: "An unknown error occurred!"});
    });
}
