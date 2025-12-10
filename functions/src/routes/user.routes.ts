import {FastifyReply} from "fastify";

import {db} from "../lib/instance";
import {verifyToken} from "../functions/jwt.auth";

export async function userRoutes(fastify: any): Promise<void> {
    fastify.get("/profile", async (req: any, res: FastifyReply): Promise<never> => {
        const username: string = await verifyToken(req) || "";
        const docs: any = await db.collection("users").where("username", "==", username).get();

        if (docs.empty) return res.code(404).send({error: "User not found!"});
        const userData: any = docs.docs[0].data();

        return res.code(200).send({userData: userData});
    });

    fastify.put("/edit/:board/:thread", async (req: any, res: FastifyReply): Promise<never> => {
        const docs: any = await db.collection(req.params.board).where("UUID", "==", req.params.thread).get();
        if (docs[0].username != await verifyToken(req) || "") return res.code(403).send({error: "Invalid credentials!"});

        await docs[0].update({title: req.body.title, content: req.body.content});

        return res.code(200).send({updateStatus: true});
    });

    fastify.put("/edit/:board/:thread/:reply", async (req: any, res: FastifyReply): Promise<never> => {
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

    fastify.delete("/delete/:board/:thread", async (req: any, res: FastifyReply): Promise<never> => {
        const docs: any = await db.collection(req.params.board).where("UUID", "==", req.params.thread).get();
        if (docs[0].username != await verifyToken(req) || "") return res.code(403).send({error: "Invalid credentials!"});

        await docs[0].delete();

        return res.code(200).send({deleteStatus: true});
    });

    fastify.delete("/delete/:board/:thread/:reply", async (req: any, res: FastifyReply): Promise<never> => {
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

    fastify.post("/rate/:board/:thread", async (req: any, res: FastifyReply): Promise<never> => {
        const username: string = await verifyToken(req) || "";
        if (username) return res.code(403).send({error: "Not logged in!"});

        await db.collection("users").where("username", "==", username)
            .limit(1).get().then(async (snapshot: any): Promise<any> => {
                if (snapshot.empty) return res.code(400).send({error: "User not found!"});

                const threadData = snapshot.docs[0].data();
                if (threadData.threadsRated.findKey(req.params.thread) != undefined) {
                    return res.code(401).send({error: "Already rated thread!"});
                }
            });

        await db.collection(req.params.board).where("UUID", "==", req.params.thread).get()
            .then(async (snapshot: any): Promise<FastifyReply> => {
                if (snapshot.empty) return res.code(400).send({error: "Thread not found!"});

                const threadRef = snapshot.docs[0].ref;
                const threadData = snapshot.docs[0].data();

                const rateCount = (threadData.rateCount + 1);
                const rating = (threadData.rating + req.body.rating) / rateCount;

                threadRef.update({
                    rating: rating,
                    rateCount: rateCount,
                });

                return res.code(200).send({rated: true});
            });

        return res.code(200).send({rated: false});
    });
}
