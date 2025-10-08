//import admin from "firebase-admin";
import {onRequest} from "firebase-functions/https";

import { fastify } from "./fastify.config"

//admin.initializeApp();
//const db = admin.firestore();

// fastify.addContentTypeParser("application/json", {}, (req: any, payload: any, done: any): void => {
//   req.rawBody = payload.rawBody;
//   done(null, payload.body)
// });

// fastify.get(`/catalog/{board}`, async (req: any, res: any): Promise<void> => {
//   db.collection(req.params.board).orderBy("createdAt", "desc").get().then((snapshot: any): void => {
//     const data = snapshot.docs.map((doc: any) => doc.data());
//     res.send(data);
//   });
// });

fastify.get("/", async (request: any, reply: any): Promise<void> => {
  reply.send({ hello: "world" });
});

fastify.get("/user", async (request: any, reply: any): Promise<void> => {
  reply.send({ user: "John Doe" });
});

exports.app = onRequest(async (req: any, res: any): Promise<void> => fastify.server.emit("request", req, res));
