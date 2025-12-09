import MarkovChain from "markovchain";
import fs from "fs";
import {readCookie, updateCookie} from "../functions/cookie.manager";
import {generateToken} from "../functions/jwt.auth";

const aiw = new MarkovChain(fs.readFileSync("./src/wonderland/story.txt", "utf8"));

export async function honeypotRoutes(fastify) {
    fastify.get("/", async (_req, res) => {
        return res.code(200).send({"story": aiw.start("The").end(100).process(), "url": crypto.randomUUID()});
    });

    fastify.get("/test", async (req, res) => {
        return res.code(200).send({"cookie": readCookie("JWT", req)});
    });
}