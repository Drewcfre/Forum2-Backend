import {FastifyReply} from "fastify";
import svgCaptcha from "svg-captcha";

/**
 * Routes which facilitate the use of tools.
 * @param {any} fastify The fastify instance.
 * @param {any} opts Options for the route.
 */
export async function toolRoutes(fastify: any, opts: any): Promise<void> {
    fastify.get("/captcha", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        const captcha = svgCaptcha.create({
            size: 8,
            ignoreChars: "0o1i",
            noise: 4,
            color: true,
            background: "#cc9966",
        });

        req.session.captcha = captcha.text;
        return res.code(200).type("svg").send(captcha.data);
    });
}
