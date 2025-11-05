import {FastifyReply} from "fastify";

import {db} from "../lib/instance";
import {verifyToken} from "../functions/jwt.auth";

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
        const username: string = await verifyToken(req) || "";

        const docs: any = await db.collection(req.params.board).where("UUID", "==", req.params.thread).get();
        if (docs[0].username != username) return res.code(403).send({error: "Invalid credentials!"});

        const replies: Array<any> = docs[0].data().replies || [];
        const selectedReply: any = replies.filter((reply: any): boolean => reply.UUID === req.params.reply);
        if (selectedReply.username !== username) return res.code(403).send({error: "Invalid credentials!"});

        selectedReply.content = req.body.content;

        docs[0].update({replies: replies});

        return res.code(200).send({updateStatus: true});
    });

    fastify.delete("/delete/:board/:thread", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        const docs: any = await db.collection(req.params.board).where("UUID", "==", req.params.thread).get();
        if (docs[0].username != await verifyToken(req) || "") return res.code(403).send({error: "Invalid credentials!"});

        await docs[0].delete();

        return res.code(200).send({deleteStatus: true});
    });

    fastify.delete("/delete/:board/:thread/:reply", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        const username: string = await verifyToken(req) || "";

        const docs: any = await db.collection(req.params.board).where("UUID", "==", req.params.thread).get();
        if (docs[0].username != username) return res.code(403).send({error: "Invalid credentials!"});

        const replies: Array<any> = docs[0].data().replies || [];
        const selectedReply: any = replies.filter((reply: any): boolean => reply.UUID === req.params.reply);
        if (selectedReply.username !== username) return res.code(403).send({error: "Invalid credentials!"});

        const filteredReply: any = replies.filter((reply: any): boolean => reply.UUID !== req.params.reply);
        docs[0].update({replies: filteredReply});

        return res.code(200).send({deleteStatus: true});
    });

    fastify.post("/rate/:board/:thread", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        // const docs: any = await db.collection(req.params.board).where("UUID", "==", req.params.thread).get();
        return res.code(500).send({error: "Not implemented!"});
    });
}
