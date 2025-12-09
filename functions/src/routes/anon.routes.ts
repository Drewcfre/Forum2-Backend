import {FastifyReply} from "fastify";

import {checkLanguage, checkThreats} from "../functions/automod";
import {submitImageToBucket} from "../functions/image.handler";
import {verifyToken} from "../functions/jwt.auth";
import {verifyPostTitle, verifyReplyContent} from "../functions/regex.checkers";
import {db, realtime} from "../lib/instance";
import {deleteCookie, readCookie} from "../functions/cookie.manager";

async function getUser(username: string, returnBool: boolean): Promise<any> {
    const docs: any = await db.collection("users").where("username", "==", username).get();

    if (returnBool) return !docs.empty;
    else {
        if(docs.empty) return "";
        else return docs.docs[0].data();
    }
}

export async function anonRoutes(fastify: any, _opts: any): Promise<void> {
    fastify.get("/profile/:username", async (req: any, res: FastifyReply): Promise<never> => {
        const userDoc: any = await getUser(req.params.username, false);
        if (userDoc === "") return res.code(404).send({error: "User not found!"});

        return res.code(200).send({
            username: userDoc.username,
            profilePic: userDoc.profilePic || "",
            title: userDoc.title || "",
            description: userDoc.description || "",
            creationDate: userDoc.creationDate,
            threadsCreated: userDoc.threadsCreated || 0,
            postsCreated: userDoc.postsCreated || 0,
        });
    });

    fastify.get("/catalog/:board", async (req: any, res: FastifyReply): Promise<never> => {
        try {
            const ref = realtime.ref(`board/${req.params.board}`);
            return res.code(200).send({body: await ref.get()});
        } catch (err) {
            return res.code(500).send({error: "An unknown error occurred!"});
        }
    });

    fastify.post("/create/:board", async (req: any, res: FastifyReply): Promise<never> => {
        try {
            const provUser: string = await verifyToken(req) || "";
            const username: string = (await getUser(provUser, true)) ? provUser : "Anonymous";

            if (username === "Anonymous") {
                if (readCookie("captcha", req) !== req.body.captcha) {
                    return res.code(401).send({error: "Incorrect CAPTCHA!"});
                }
            }

            deleteCookie("captcha", 1000 * 60, res);

            if (!verifyPostTitle(req.body.title)) return res.code(400).send({error: "Invalid title!"});

            let url = "";
            if (req.body.image) url = await submitImageToBucket(await req.body.image, req.params.board);

            const title = checkLanguage(req.body.title);
            const content = checkLanguage(req.body.content);

            const flagged = checkThreats(title) || checkThreats(content);

            await db.collection(req.params.board).add({
                UUID: crypto.randomUUID(),
                username: username,
                creationDate: new Date(),
                url: url,
                title: title,
                content: content,
                replies: [],
                rating: 3.0,
                rateCount: 1,
                flagged: flagged,
                live: req.body.live,
            });

            if (req.body.live) {
                const ref = realtime.ref(`board/${req.params.board}/${req.params.thread}`);
                await ref.set({replies: []});
            }

            return res.code(201).send({created: true});
        } catch (err) {
            console.error(err);
            return res.code(500).send({error: "Server error!"});
        }
    });

    fastify.post("/reply/:board/:thread", async (req: any, res: FastifyReply): Promise<never> => {
        const provUser: string = await verifyToken(req) || "";
        const username: string = (await getUser(provUser, true)) ? provUser : "Anonymous";

        if (username === "Anonymous") {
            if (readCookie("captcha", req) !== req.body.captcha) {
                return res.code(401).send({error: "Incorrect CAPTCHA!"});
            }
        }

        deleteCookie("captcha", 1000 * 60, res);

        if (!verifyReplyContent(req.body.content)) return res.code(400).send({error: "Invalid content!"});

        let url = "";
        if (req.body.image) url = await submitImageToBucket(await req.body.image, req.params.board);

        const content = checkLanguage(req.body.content);
        const flagged = checkThreats(content);

        return db.collection(req.params.board).where("UUID", "==", req.params.thread)
            .get().then(async (snapshot: any): Promise<FastifyReply> => {
                if (snapshot.empty) return res.code(404).send({error: "Thread not found!"});

                const threadRef = snapshot.docs[0].ref;
                const threadData = snapshot.docs[0].data();

                await threadRef.update({
                    replies: threadData.replies.concat([{
                        UUID: crypto.randomUUID(),
                        username: username,
                        creationDate: new Date(),
                        url: url,
                        content: content,
                        flagged: flagged,
                    }]),
                });

                return res.code(201).send({created: true});
            });
    });

    fastify.get("/live/:board/:thread", async (req: any, res: FastifyReply): Promise<never> => {
        const ref = realtime.ref(`board/${req.params.board}/${req.params.thread}`);
        return res.code(200).send({body: ref.get()});
    });

    fastify.post("/reply/live/:board/:thread", async (req: any, res: FastifyReply): Promise<never> => {
        const ref = realtime.ref(`board/${req.params.board}/${req.params.thread}`);
        await ref.set((await ref.get() + req.body.content));
        return res.code(200).send({body: ref.get()});
    });
}
