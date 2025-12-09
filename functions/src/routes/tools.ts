import {FastifyReply} from "fastify";
import svgCaptcha from "svg-captcha";

import {readCookie, updateCookie} from "../functions/cookie.manager";

export async function toolRoutes(fastify: any, _opts: any): Promise<void> {
    fastify.get("/captcha", async (_req: any, res: FastifyReply): Promise<never> => {
        const captcha = svgCaptcha.create({
            size: 8,
            ignoreChars: "0o1i",
            noise: 3,
            color: false,
            background: "#000",
        });

        updateCookie("captcha", captcha.text, 1000 * 60, res);
        return res.code(200).type("svg").send(captcha.data);
    });

    fastify.get("/customization", async (req: any, res: FastifyReply): Promise<never> => {
        return res.code(200).send({
            "theme": readCookie("theme", req),
            "font":  readCookie("font",  req),
            "style": readCookie("style", req),
        });
    });

    fastify.post("/customization/:theme/:font/:style", async (req: any, res: FastifyReply): Promise<never> => {
        updateCookie("theme", req.params.theme, 1000 * 60 * 60 * 24 * 365, res);
        updateCookie("font",  req.params.font,  1000 * 60 * 60 * 24 * 365, res);
        updateCookie("style", req.params.style, 1000 * 60 * 60 * 24 * 365, res);

        return res.code(200);
    });

    fastify.get("/notice", async (req: any, res: FastifyReply): Promise<never> => {
       return res.code(200).send({ "cookieNotice": readCookie("cookieNotice", req) });
    });

    fastify.post("/notice", async (_req: any, res: FastifyReply): Promise<never> => {
        updateCookie("cookieNotice", "true", 1000 * 60 * 60 * 24 * 365, res);

        return res.code(200);
    });
}
