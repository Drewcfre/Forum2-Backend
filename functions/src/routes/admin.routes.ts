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
    fastify.get("/reports", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        if (!await adminCheck(await verifyToken(req) || "")) return res.code(403).send({error: "Invalid Credentials!"});

        await db.collection("reports").get().then((snapshot: any): FastifyReply => {
            const data = snapshot.docs.map((doc: any): any => doc.data());
            return res.code(200).send(data);
        });

        return res.code(500).send({error: "An unknown error occurred!"});
    });

    fastify.put("/ban/:uuid", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        if (!await adminCheck(await verifyToken(req) || "")) return res.code(403).send({error: "Invalid Credentials!"});

        await db.collection("users")
            .where("UUID", "==", req.params.uuid)
            .get()
            .then((snapshot: any): FastifyReply => {
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

    fastify.post("/blacklist/:ip", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        if (!await adminCheck(await verifyToken(req) || "")) return res.code(403).send({error: "Invalid Credentials!"});

        await db.collection("blacklist")
            .where("ip", "==", req.params.ip)
            .get()
            .then((snapshot: any): FastifyReply => {
                if (!snapshot.empty) return res.code(400).send({error: "IP already blacklisted!"});

                db.collection("blacklist").add({
                    ip: req.params.ip,
                    dateAdded: new Date(),
                    reason: req.body.reason || "No reason provided.",
                });

                return res.code(201).send({message: "IP blacklisted!"});
            });

        return res.code(500).send({error: "An unknown error occurred!"});
    });
}
