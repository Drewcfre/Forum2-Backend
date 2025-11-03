import {FastifyReply} from "fastify";

import {db} from "../lib/instance";
import {verifyToken} from "../functions/jwt.auth";

// TODO: Add ability to modify/delete replies.

/**
 * Routes that require basic user authorization.
 * @param {any} fastify The fastify instance.
 * @param {any} opts Options for the route.
 */
export async function userRoutes(fastify: any, opts: any): Promise<void> {
    fastify.put("/edit/:board/:thread", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        const docs: any = await db.collection(req.params.board).where("UUID", "==", req.params.thread).get();
        if (docs[0].username != await verifyToken(req) || "") return res.code(403).send({error: "Invalid credentials!"});

        await docs[0].update({
            title: req.body.title,
            content: req.body.content,
        });

        return res.code(200).send({updateStatus: true});
    });

    fastify.put("/edit/:board/:thread/:reply", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        return res.code(500).send({error: "Not implemented!"});
    });

    fastify.delete("/delete/:board/:thread", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        const docs: any = await db.collection(req.params.board).where("UUID", "==", req.params.thread).get();
        if (docs[0].username != await verifyToken(req) || "") return res.code(403).send({error: "Invalid credentials!"});

        await docs[0].delete();

        return res.code(200).send({deleteStatus: true});
    });

    fastify.delete("/reply/delete/:board/:reply", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        return res.code(500).send({error: "Not implemented!"});
    });

    fastify.post("/rate/:board/:thread", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        // const docs: any = await db.collection(req.params.board).where("UUID", "==", req.params.thread).get();
        return res.code(500).send({error: "Not implemented!"});
    });
}
