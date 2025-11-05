import {onSchedule} from "firebase-functions/scheduler";
import {onRequest} from "firebase-functions/v2/https";

import {fastify} from "./fastify.config";
import {db, realtime} from "./lib/instance";

// region Route Imports
import {adminRoutes} from "./routes/admin.routes";
fastify.register(adminRoutes, {prefix: "/admin"});

import {anonRoutes} from "./routes/anon.routes";
fastify.register(anonRoutes, {prefix: "/anon"});

import {devRoutes} from "./routes/dev.routes";
fastify.register(devRoutes, {prefix: "/dev"});

import {toolRoutes} from "./routes/tools";
fastify.register(toolRoutes, {prefix: "/tools"});

import {userAuthRoutes} from "./routes/user.auth";
fastify.register(userAuthRoutes, {prefix: "/user"});

import {userRoutes} from "./routes/user.routes";
fastify.register(userRoutes, {prefix: "/user"});
// endregion

// Reroutes all requests to this cloud function through the Fastify instance.
exports.app = onRequest(async (req: any, res: any): Promise<void> => {
    fastify.server.emit("request", req, res);
});

// To reduce load on the Firestore database, common queries are periodically made and saved to a Realtime database.
// By allowing admin queries to go to the Firestore database directly, this also acts as a
exports.updateRealtime = onSchedule("every 2 minutes", async (): Promise<void> => {
    const boards = ["Main", "Anime", "Cook", "Fit", "Tech", "Vidya", "Admin"];

    for (const board of boards) {
        await db.collection(board).get().then((snapshot: any): void => {
            const data = snapshot.docs.map((doc: any) => doc.data());
            const ref = realtime.ref("");

            ref.set({board: data});
        });
    }
});
