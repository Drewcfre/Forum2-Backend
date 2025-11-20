import {FastifyReply} from "fastify";
import svgCaptcha from "svg-captcha";

/**
 * Routes which facilitate the use of tools rather than functions associated with the forum.
 * @param {any} fastify The fastify instance.
 * @param {any} opts Options for the route.
 */
export async function toolRoutes(fastify: any, opts: any): Promise<void> {
    fastify.get("/captcha", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        const captcha = svgCaptcha.create({
            size: 8,
            ignoreChars: "0o1i",
            noise: 3,
            color: false,
            background: "#000",
        });

        req.cookies.captcha = req.signCookie(captcha.text);

        return res.code(200).type("svg").send(captcha.data);
    });
}
