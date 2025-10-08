const fastify: any = require(`fastify`)({ logger: true })

const rateLimit: any = require(`@fastify/rate-limit`)
fastify.register(rateLimit, { global: true, max: 10, ban: 10, timeWindow: 1000 })
fastify.setNotFoundHandler(
  { preHandler: (req: any, res: any, done: any) => done() },
  function (req: any, res: any) { res.code(404).send({ error: `URL not found!` }) }
)

fastify.register(require(`@fastify/routes`))
fastify.register(require(`@fastify/routes-stats`), { printInterval: 60000, decoratorName: `performance` })

fastify.register(require(`@fastify/helmet`), {
  global: true,
  contentSecurityPolicy: {
    directives: {
      // Put header config stuff here later.
    }
  }
})

fastify.ready()
export { fastify }
