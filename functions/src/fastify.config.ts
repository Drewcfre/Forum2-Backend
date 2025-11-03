// TODO: Review and clean up Fastify config.

import Fastify, {FastifyReply} from "fastify";
// eslint-disable-next-line new-cap
const fastify = Fastify({logger: true});

import cors from "@fastify/cors";
fastify.register(cors, {
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    preflightContinue: false,
    credentials: true,
});

fastify.addHook("onSend", async (request, reply, payload) => {
    reply.header("Access-Control-Allow-Origin", "http://localhost:4173");
    reply.header("Vary", "Origin");
    return payload;
});

fastify.addHook("preHandler", async (req, reply) => {
    console.log(`[REQ] ${req.method} ${req.url} Origin=${req.headers.origin}`);
});

import fastifyRateLimit from "@fastify/rate-limit";
fastify.register(fastifyRateLimit, {global: true, max: 10, ban: 10, timeWindow: 1000});
fastify.setNotFoundHandler(
    {preHandler: (req: any, res: FastifyReply, done: any): any => done()},
    function(req: any, res: FastifyReply): void {
        res.code(404).send({error: "URL not found!"});
    }
);

import fastifyRoutes from "@fastify/routes";
fastify.register(fastifyRoutes);

import fastifyRoutesStats from "@fastify/routes-stats";
fastify.register(fastifyRoutesStats, {
    printInterval: 60000,
    decoratorName: "performance",
});

import fastifyHelmet from "@fastify/helmet";
fastify.register(fastifyHelmet, {
    global: true,
    contentSecurityPolicy: {
        directives: {
            "child-src": [
                "https://forum2-dun.vercel.app",
                "https://127.0.0.1",
                "http://localhost:4173",
                "'self'",
            ],
            "connect-src": [
                "https://forum2-dun.vercel.app",
                "https://127.0.0.1",
                "http://localhost:4173",
                "'self'",
            ],
            "frame-src": "'none'",
        },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginResourcePolicy: {policy: "same-origin"},
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

import fastifyCookie from "@fastify/cookie";
fastify.register(fastifyCookie);

import fastifySession from "@fastify/session";

// TODO: Fix Session declaration issue.

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
fastify.register(fastifySession, {
    secret: process.env.SESSION_SECRET,
    cookie: {
        secure: true,
        httpOnly: true,
        maxAge: 86400000,
    },
    saveUninitialized: false,
    rolling: true,
});

fastify.addContentTypeParser("application/json", {},
    (req: any, payload: any, done: any) => {
        req.rawBody = payload.rawBody;
        done(null, payload.body);
    }
);

fastify.ready();
export {fastify};
