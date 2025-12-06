import "dotenv/config";

import Fastify, {FastifyReply} from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";

// eslint-disable-next-line new-cap
const fastify = Fastify({logger: true});

const allowList = new Set([
    "https://localhost:4173",
    "https://forum2-dun.vercel.app",
]);

// Note that Firebase CORS settings are disabled for this function. All CORS handling is done here.
fastify.register(cors, {
    origin: (origin, cb): void => {
        if (!origin) return cb(null, true);
        if (allowList.has(origin)) return cb(null, true);
        return cb(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin"],
    exposedHeaders: ["Set-Cookie"],
    preflight: true,
    preflightContinue: false,
});

import fastifyRateLimit from "@fastify/rate-limit";
fastify.register(fastifyRateLimit, {global: true, max: 10, ban: 10, timeWindow: 1000});
fastify.setNotFoundHandler(
    {preHandler: (_req: any, _res: FastifyReply, done: any): any => done()},
    function(_req: any, res: FastifyReply): void {
        res.code(404).send({error: "URL not found!"});
    },
);

import fastifyHelmet from "@fastify/helmet";
fastify.register(fastifyHelmet, {
    global: true,
    contentSecurityPolicy: {
        directives: {
            "child-src": allowList,
            "connect-src": allowList,
            "frame-src": "'none'",
        },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginResourcePolicy: {policy: "cross-origin"},
    strictTransportSecurity: {
        maxAge: 63072000,
        includeSubDomains: true,
        preload: true,
    },
    xDnsPrefetchControl: {allow: true},
    xFrameOptions: {action: "deny"},
    xPermittedCrossDomainPolicies: {permittedPolicies: "none"},
    xPoweredBy: false,
    xXssProtection: true,
});

fastify.addContentTypeParser("application/json", {},
    (req: any, payload: any, done: any) => {
        req.rawBody = payload.rawBody;
        done(null, payload.body);
    }
);

fastify.register(cookie, {secret: `${process.env.COOKIE_SECRET}`, parseOptions: {}});

// For debugging: Log each request method and URL.
fastify.addHook("preHandler", async (req, _res): Promise<void> => {
    console.log(`[REQ] ${req.method} ${req.url} Origin=${req.headers.origin}`);
});

// I had some very strange issues regarding sessions not being saved properly.
// In order to ensure my capstone project is completed on time, I'm going to manually handle individual cookies for now.
fastify.addHook("onSend", async (req: any, res: FastifyReply, payload: unknown): Promise<unknown> => {
    res.removeHeader("Set-Cookie");

    let value: string = (req.cookies != null && req.cookies.captcha != null) ? req.unsignCookie(req.cookies.captcha).value : "";
    res.setCookie("captcha", value, {
        signed: true,
        secure: true,
        httpOnly: false,
        maxAge: 1000 * 60, // 1 minute in milliseconds.
        sameSite: "none",
    });

    value = (req.cookies != null && req.cookies.JWT != null) ? req.unsignCookie(req.cookies.JWT).value : "";
    res.setCookie("JWT", value, {
        signed: true,
        secure: true,
        httpOnly: false,
        maxAge: 1000 * 60 * 60, // 1 hour in milliseconds.
        sameSite: "none",
    });

    // If third-party cookies are blocked, the website will not function properly.
    // A notice is shown to the user if this cookie is not present.
    value = (req.cookies != null && req.cookies.cookieNotice != null) ?
        req.unsignCookie(req.cookies.cookieNotice).value : "false";
    res.setCookie("cookieNotice", value, {
        signed: true,
        secure: true,
        httpOnly: false,
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year in milliseconds.
        sameSite: "none",
    });

    value = (req.cookies != null && req.cookies.theme != null) ? req.unsignCookie(req.cookies.theme).value : "classic";
    console.log("theme: " + value);
    res.setCookie("theme", value, {
        signed: true,
        secure: true,
        httpOnly: false,
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year in milliseconds.
        sameSite: "none",
    });

    value = (req.cookies != null && req.cookies.font != null) ? req.unsignCookie(req.cookies.font).value : "Monospace";
    res.setCookie("font", value, {
        signed: true,
        secure: true,
        httpOnly: false,
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year in milliseconds.
        sameSite: "none",
    });

    value = (req.cookies != null && req.cookies.style != null) ? req.unsignCookie(req.cookies.style).value : "classic";
    res.setCookie("style", value, {
        signed: true,
        secure: true,
        httpOnly: false,
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year in milliseconds.
        sameSite: "none",
    });

    return payload;
});

fastify.ready();
export {fastify};
