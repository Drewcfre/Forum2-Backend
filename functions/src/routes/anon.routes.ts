import {FastifyReply} from "fastify";

import {verifyToken} from "../functions/jwt.auth";
import {bucket, db} from "../lib/instance";

import sharp from "sharp";
import {verifyPostTitle, verifyReplyContent} from "../functions/regex.checkers";

/**
 * Saves image data to storage and returns the associated URL.
 * @param {any} imageData The image to save.
 * @param {string} board The board the image was sent to.
 * @return {Promise<string>} The created URL.
 */
async function submitImageToBucket(imageData: any, board: string): Promise<string> {
    const {filename, mimetype, data} = await imageData;
    const imgBuffer = Buffer.from(data, "base64");

    const outputBuffer = await sharp(imgBuffer)
        .webp({quality: 80, effort: 3})
        .toBuffer();

    await bucket.file(`/uploads/${board}/${filename}`).save(outputBuffer, {
        metadata: {contentType: mimetype},
    });

    // Not a permanent URL, but I don't expect anyone in 2500 to be complaining about it.
    return await bucket.file(`/uploads/${filename}`)
        .getSignedUrl({action: "read", expires: "03-01-2500"})
        .then((urls: string[]): string => urls[0]);
}

/**
 * Routes that require no authorization. Anonymous access requires the user to solve a Captcha, however.
 * @param {any} fastify The fastify instance.
 * @param {any} opts Options for the route.
 */
export async function anonRoutes(fastify: any, opts: any): Promise<void> {
    fastify.get("/catalog/:board", async (req: any, res: FastifyReply): Promise<any> => {
        // TODO: When active posts are implemented, only return active posts here.
        try {
            await db.collection(req.params.board).get().then((snapshot: any): FastifyReply => {
                const data = snapshot.docs.map((doc: any) => doc.data());
                console.log(data);
                return res.code(200).send({body: data});
            });
        } catch (err) {
            return res.code(500).send({error: "An unknown error occurred!"});
        }
    });

    fastify.post("/create/:board", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        try {
            const username: string = await verifyToken(req) || "Anonymous";
            if (username == "Anonymous") {
                if (req.session.captcha != req.body.captcha) {
                    return res.code(401).send({error: "Incorrect CAPTCHA!"});
                }
            }

            if (!verifyPostTitle(req.body.title)) return res.code(400).send({error: "Invalid title!"});

            const url = await submitImageToBucket(await req.body.image, req.params.board);

            await db.collection(req.params.board).add({
                UUID: crypto.randomUUID(),
                username: username,
                creationDate: new Date(),
                url: url,
                title: req.body.title,
                content: req.body.content,
                replies: [],
                rating: 3.0,
                rateCount: 1,
                timeLimit: null, // No time limit by default for now.
                active: true, // In the future, posts will be deactivated after their time limit expires and no longer show up.
            });

            return res.code(201).send({message: "Success!"});
        } catch (err) {
            console.error(err);
            return res.code(500).send({error: "Server error"});
        }
    });

    fastify.post("/reply/:board/:thread", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        const username: string = await verifyToken(req) || "Anonymous";
        if (username == "Anonymous") {
            if (req.session.captcha != req.body.captcha) {
                return res.code(401).send({error: "Incorrect CAPTCHA!"});
            }
        }

        if (!verifyReplyContent(req.body.content)) return res.code(400).send({error: "Invalid content!"});

        const url = await submitImageToBucket(await req.body.image, req.params.board);
        db.collection(req.params.board).where("UUID", "==", req.params.thread)
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
                        content: req.body.content,
                    }]),
                });

                return res.code(201).send({message: "Reply added!"});
            });

        return res.code(500).send({error: "An unknown error occurred!"});
    });
}
