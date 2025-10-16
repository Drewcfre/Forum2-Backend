import {FastifyReply} from "fastify";

// TODO: Implement admin route functionalities.

/**
 * Routes for admin functionalities such as managing users and content as well
 * as analytics and an admin board.
 * @param {any} fastify The fastify instance.
 * @param {any} opts Options for the route.
 */
export async function adminRoutes(fastify: any, opts: any): Promise<void> {
  fastify.put("/ban/:id",
    async (req: any, res: FastifyReply): Promise<FastifyReply> => {
      return res.code(501).send({error: "Not Implemented!"});
    }
  );

  fastify.post("/blacklist/:ip",
    async (req: any, res: FastifyReply): Promise<FastifyReply> => {
      return res.code(501).send({error: "Not Implemented!"});
    }
  );
}
