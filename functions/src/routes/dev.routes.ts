import { FastifyReply }    from 'fastify'
import { verifyDeveloper } from '../jwt.auth'

async function devRoutes(fastify: any, opts: any) {
  fastify.get('/test', async (req: any, res: FastifyReply): Promise<FastifyReply> => {
    if(await verifyDeveloper(req)) {
      let currentTime: any = new Date()
      let timeActiveInMilliseconds = currentTime - instanceStartTime

      return res.code(200).send({
        name:                     'Beatrice -- Forum2 Backend',
        instanceStartTime:        instanceStartTime,
        timeActiveInMilliseconds: timeActiveInMilliseconds
      })
    }
    else return res.code(403).send({ error: 'Invalid Credentials!' })
  })

  fastify.get('/routes', async (req: any, res: FastifyReply): Promise<FastifyReply> => {
    if(await verifyDeveloper(req)) return res.code(200).send({ routes: fastify.routes })
    else return res.code(403).send({ error: 'Invalid Credentials!' })
  })

  fastify.get('/status', async (req: any, res: any): Promise<void> => {
    if(await verifyDeveloper(req)) return res.code(200).send({ routeStatus: fastify.stats() })
    else return res.code(403).send({ error: 'Invalid Credentials!' })
  })
}

module.exports = devRoutes
