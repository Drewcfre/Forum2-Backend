import {FastifyReply} from "fastify";

import {db} from "../lib/instance";
import {verifyToken} from "../functions/jwt.auth";

export async function adminRoutes(fastify: any): Promise<void> {
    fastify.addHook("preHandler", async (req: any, res: FastifyReply): Promise<void> => {
        const isAdmin = await db.collection("users")
            .where("username", "==", await verifyToken(req))
            .where("admin", "==", true)
            .get().then((snapshot: any): boolean => !snapshot.empty);

        if (!isAdmin) res.code(403).send({error: "Invalid Credentials!"});
    })

    fastify.get("/users/all", async (_req: any, res: FastifyReply): Promise<never> => {
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

    fastify.put("/ban/:username", async (req: any, res: FastifyReply): Promise<never> => {
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

    fastify.get("/reports", async (_req: any, res: FastifyReply): Promise<never> => {
        await db.collection("Admin").get().then((snapshot: any): FastifyReply => {
            const data = snapshot.docs.map((doc: any): any => doc.data());
            return res.code(200).send(data);
        });

        return res.code(500).send({error: "An unknown error occurred!"});
    });
}
