import {FastifyReply} from "fastify";

import {verifyToken} from "../functions/jwt.auth";
import {db, instanceStartTime} from "../lib/instance";

export async function devRoutes(fastify: any, opts: any): Promise<void> {
    fastify.addHook("preHandler", async (req: any, res: FastifyReply): Promise<void> => {
        // TODO: Come up with a more sustainable developer verify method.
        if (await verifyToken(req) !== `${process.env.DEV_USERNAME}`) res.code(403).send({error: "Invalid Credentials!"});
    });

    fastify.get("/test", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        return res.code(200).send({
            name: "Beatrice -- Forum2 Backend",
            instanceStartTime: instanceStartTime,
            timeActiveInMilliseconds: Math.abs(new Date().getTime() - instanceStartTime.getTime()),
        });
    });

    fastify.get("/routes", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        return res.code(200).send({routes: await fastify.routes});
    });

    fastify.post("/create/admin/:username", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        const users: any = await db.collection("users").where("username", "==", req.params.username).get();
        users[0].update({admin: true});

        return res.code(200);
    });
}
