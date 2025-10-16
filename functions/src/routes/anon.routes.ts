import {FastifyReply} from "fastify";

import {db} from "../lib/instance";
import {verifyToken} from "../functions/jwt.auth";

// TODO: Clean this up at some point.

/**
 * Routes that require no authorization. Anonymous access requires the user to
 * solve a Captcha, however.
 * @param {any} fastify The fastify instance.
 * @param {any} opts Options for the route.
 */
export async function anonRoutes(fastify: any, opts: any): Promise<void> {
  fastify.get("/catalog/:board/:sort}/:dir",
    async (req: any, res: FastifyReply): Promise<FastifyReply> => {
      await db.collection(req.params.board)
        .orderBy(req.params.sort, req.params.dir)
        .get().then((snapshot: any): void => {
          const data = snapshot.docs.map((doc: any) => doc.data());
          res.code(200).send(data);
        }).catch((err: any): void => {
          res.code(500).send({error: "Error getting documents: " + err});
        });

      return res;
    }
  );

  fastify.post("/create/:board",
    async (req: any, res: FastifyReply): Promise<FastifyReply> => {
      const username = (req.session.jwt != null) ?
        await verifyToken(req) : "Anonymous";

      await db.collection(req.params.board).add({
        username: username,
        creationDate: new Date(),
        title: req.body.title,
        content: req.body.content,
        replies: [],
      });

      return res.code(201).send({message: "Success!"});
    }
  );

  // TODO: Implement reply creation.

  fastify.post("/reply/:thread",
    async (req: any, res: FastifyReply): Promise<FastifyReply> => {
      return res.code(500).send({error: "Not implemented!"});
    }
  );
}
