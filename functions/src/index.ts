import { onRequest } from 'firebase-functions/https'

const { db } = require('./lib/firestore')
import { fastify } from './fastify.config'
import { verifyToken, verifyDeveloper } from './jwt.auth'

const userAuthRoutes = require('./routes/user.auth')
const devRoutes      = require('./routes/dev.routes')

fastify.register(userAuthRoutes, { prefix: '/user' })
fastify.register(devRoutes,      { prefix: '/dev' })

const instanceStartTime: any = new Date()



// Access Levels
// Anonymous -- No account, limited board access, no rating posts, limited number of posts per day
// User      -- Personal account, access to all boards, able to rate other posts, unlimited posts per day
// Admin     -- Admin panel, access to admin baord, can remove or pin any post, can ban or blacklist users
// Developer -- Can edit or remove any post or account, has access to dev panel

//region Anonymous Functions
// Performs a query on all active threads in a board, sorting by the specified parameter. Returns a list of 100 threads.
fastify.get('/catalog/:board/:sort}/:dir', async (req: any, res: any): Promise<void> => {
  db.collection(req.params.board).orderBy(req.params.sort, req.params.dir).get().then((snapshot: any): void => {
    const data = snapshot.docs.map((doc: any) => doc.data())
    res.send(data)
  })
})

// Creates a thread in the specified board.
fastify.post('/thread/create/:board', async (req: any, res: any): Promise<void> => {
  console.log("Accessed method!")
  let username = (req.session.jwt != null) ? await verifyToken(req) : 'Anonymous'

  console.log("Adding post...")
  await db.collection(req.params.board).add({
    username: username,
    creationDate: new Date(),
    title: req.body.title,
    content: req.body.content,
    replies: []
  })

  res.code(201).send({ message: "Success!" })
})

// Creates a reply under the specified thread.
fastify.post('/reply/create/:thread', async (req: any, res: any): Promise<void> => {

})
//endregion

//region User Functions
// Allows a user to edit a thread they previously made.
fastify.put('/thread/edit/:thread', async (req: any, res: any): Promise<void> => {

})

fastify.delete('/thread/delete/:thread', async (req: any, res: any): Promise<void> => {

})

// Allows a user to edit a reply they previously made.
fastify.put('/reply/edit/:reply', async (req: any, res: any): Promise<void> => {

})
//endregion

//region Admin Functions
fastify.put('/user/ban/:id', async (req: any, res: any): Promise<void> => {

})

fastify.post('/blacklist/:ip', async (req: any, res: any): Promise<void> => {

})
//endregion

// Reroutes all requests to this cloud function through the Fastify instance.
exports.app = onRequest(async (req: any, res: any): Promise<void> => fastify.server.emit("request", req, res))
