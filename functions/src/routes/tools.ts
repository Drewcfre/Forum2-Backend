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

        const text: string = captcha.text;
        console.log(text);
        req.cookies.captcha = req.signCookie(text);

        return res.code(200).type("svg").send(captcha.data);
    });

    fastify.get("/customization", async (req: any, res: FastifyReply): Promise<FastifyReply> => {
        return res.code(200).send({
            "theme": req.unsignCookie(req.cookies.theme).value,
            "font": req.unsignCookie(req.cookies.font).value,
            "style": req.unsignCookie(req.cookies.style).value,
        });
    });
}
