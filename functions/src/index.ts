import functions from "firebase-functions/v1";
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

import {honeypotRoutes} from "./wonderland/honeypot";
fastify.register(honeypotRoutes, {prefix: "/story"});
// endregion

import fastifyRoutes from "@fastify/routes";
fastify.register(fastifyRoutes);

console.log("Fastify Routes Registered!");

// Reroutes all user requests to this cloud function through the Fastify instance.
exports.app = onRequest({cors: false}, async (req: any, res: any): Promise<void> => {
    fastify.server.emit("request", req, res);
});

// To reduce load on the Firestore database, common queries are periodically made and saved to a Realtime database.
// By allowing admin queries to go to the Firestore database directly, this also acts as a buffer to prevent toxic
// content from being visible to the majority of users before being removed.
exports.updateRealtime = functions.pubsub.schedule("every 2 minutes").onRun(async (): Promise<void> => {
    console.log("Updating Realtime Database...");

    const boards = ["Main", "Anime", "Cooking", "Fitness", "Technology", "Vidya", "Admin"];

    for (const board of boards) {
        await db.collection(board).get().then((snapshot: any): void => {
            const data = snapshot.docs.map((doc: any) => doc.data());
            const ref = realtime.ref(`board/${board}`);

            ref.set({board: data});
        });
    }

    console.log("Update Complete!");
});

// Live posts have their replies exist on a Realtime database so that potentially hundreds of requests per second
// can be handled without straining the Firestore database. To make room for future live posts, currently active
// live posts are deleted every hour.
exports.clearLivePosts = functions.pubsub.schedule("every hour").onRun(async (): Promise<void> => {
    console.log("Clearing Live Posts...");

    const boards = ["Main", "Anime", "Cooking", "Fitness", "Technology", "Vidya", "Admin"];

    for (const board of boards) {
        await db.collection(board).where("live", "==", true).get().then((snapshot: any): void => {
            snapshot.docs.forEach((doc: any): any => {
                const ID: string = doc.UUID;
                const ref = realtime.ref(`live/${ID}`);
                ref.remove();

                doc.delete();
            });
        });
    }

    console.log("Clear Complete!");
});
