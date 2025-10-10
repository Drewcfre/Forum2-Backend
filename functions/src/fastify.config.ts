const fastify: any = require('fastify')({ logger: true })

fastify.register(require('@fastify/rate-limit'), { global: true, max: 10, ban: 10, timeWindow: 1000 })
fastify.setNotFoundHandler(
  { preHandler: (req: any, res: any, done: any) => done() },
  function (req: any, res: any) { res.code(404).send({ error: 'URL not found!' }) }
)

fastify.register(require('@fastify/routes'))
fastify.register(require('@fastify/routes-stats'), { printInterval: 60000, decoratorName: 'performance' })

fastify.register(require('@fastify/helmet'), {
  global: true,
  contentSecurityPolicy: {
    directives: {
      // Put header config stuff here later.
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginResourcePolicy: { policy: 'same-origin' },
  strictTransportSecurity: {
    maxAge: 63072000,
    includeSubDomains: true,
    preload: true
  },
  xDnsPrefetchControl: { allow: true },
  xFrameOptions: { action: 'deny' },
  xPermittedCrossDomainPolicies: { permittedPolicies: 'none' },
  xPoweredBy: false,
  xXssProtection: true
})

fastify.register(require('@fastify/cookie'))
fastify.register(require('@fastify/session'), { secret: process.env.SESSION_SECRET })

fastify.ready()
export { fastify }
