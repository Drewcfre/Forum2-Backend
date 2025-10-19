import {FastifyReply} from "fastify";

import {verifyDeveloper} from "../functions/jwt.auth";
import {instanceStartTime} from "../lib/instance";

/**
 * Contains testing routes for development purposes.
 * @param {any} fastify The fastify instance.
 * @param {any} opts Options for the route.
 */
export async function devRoutes(fastify: any, opts: any): Promise<void> {
    fastify.get("/test", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        if (await verifyDeveloper(req)) {
            const currentTime: Date = new Date();
            const timeActiveInMilliseconds =
            Math.abs(currentTime.getTime() - instanceStartTime.getTime());

            return res.code(200).send({
                name: "Beatrice -- Forum2 Backend",
                instanceStartTime: instanceStartTime,
                timeActiveInMilliseconds: timeActiveInMilliseconds,
            });
        } else return res.code(403).send({error: "Invalid Credentials!"});
    });

    fastify.get("/routes", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        if (await verifyDeveloper(req)) return res.code(200).send({routes: fastify.routes});
        else return res.code(403).send({error: "Invalid Credentials!"});
    });

    fastify.get("/status", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        if (await verifyDeveloper(req)) return res.code(200).send({routeStatus: fastify.stats()});
        else return res.code(403).send({error: "Invalid Credentials!"});
    });
}
