import {FastifyReply} from "fastify";

import {db} from "../lib/instance";
import {verifyToken} from "../functions/jwt.auth";
import admin from "firebase-admin";

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

        if (docs.docs[0].data().username !== await verifyToken(req) || "") {
            return res.code(403).send({error: "Invalid credentials!"});
        }

        await docs.docs[0].ref.delete();

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
        if (username === "") return res.code(403).send({error: "Not logged in!"});

        const user: any = await db.collection("users").where("username", "==", username).get();
        if (user.empty) return res.code(400).send({error: "User not found!"});

        const userData = user.docs[0].data();
        if (userData.postsRated.includes(req.params.thread)) return res.code(401).send({error: "Already rated thread!"});

        const thread: any = await db.collection(req.params.board).where("UUID", "==", req.params.thread).get();
        if (thread.empty) return res.code(400).send({error: "Thread not found!"});

        const threadRef = thread.docs[0].ref;
        const threadData = thread.docs[0].data();

        const currentUser: any = await db.collection("users").where("username", "==", username).get();
        currentUser.docs[0].ref.update({postsRated: admin.firestore.FieldValue.arrayUnion(threadData.UUID)});

        const rateCount = (threadData.rateCount + 1);

        console.log("Add: " + (threadData.rating + parseFloat(req.params.rating)));

        const rating = (threadData.rating + parseFloat(req.body.rating)) / rateCount;

        console.log(rateCount);
        console.log(rating);

        threadRef.update({rating: rating, rateCount: rateCount});

        return res.code(200).send({rated: true});
    });
}
