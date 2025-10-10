import admin from 'firebase-admin'
import {onRequest} from 'firebase-functions/https'

import bcrypt from 'bcrypt'

import { fastify } from './fastify.config'
import { verifyToken, verifyDeveloper } from './jwt.auth'

const instanceStartTime = new Date()

admin.initializeApp();
const db = admin.firestore();

//region Account Auth Functions
// Recieves and parses sign up data, creating a new user account if all conditions are met.
fastify.post('/user/register', async (req: any, res: any): Promise<void> => {
  let verifyKey = crypto.randomUUID().toString()
  console.log(`(${verifyKey}): Registering user...`)

  let { username, password, email } = req.body

  if(!username || username.trim() === '') {
    console.log(`(${verifyKey}): Invalid username!`)
    res.code(400).send({ error: 'Invalid username!' })
  }
  if(!password || password.trim() === '') {
    console.log(`(${verifyKey}): Invalid password!`)
    res.code(400).send({ error: 'Invalid password!' })
  }
  if(!email || email.trim() === '') {
    console.log(`(${verifyKey}): Invalid email!`)
    res.code(400).send({ error: 'Invalid email!' })
  }

  console.log(`(${verifyKey}): Valid credentials recieved!`)

  if(await db.collection('users').where('username', '==', username)) {
    console.log(`(${verifyKey}): Username taken!`)
    res.code(400).send({ error: 'Username taken!' })
  }

  try {
      console.log(`(${verifyKey}): Hashing password...`)
      password = bcrypt.hashSync(password, 8)
      console.log(`(${verifyKey}): Password hashed!`)

      console.log(`(${verifyKey}): Creating account...`)
      const account = await db.collection('users').add({
        username: username,
        password: password,
        email:    email
      })
      console.log(`(${verifyKey}): User ${account.insertedId} registered!`)


  }
  catch (error) {
      console.error(`(${verifyKey}): Error registering user: ${error}`)
      res.code(500).send({ error: 'Internal server error! Please try again later!' })
  }
})


//endregion

// Access Levels
// Anonymous -- No account, limited board access, no rating posts, limited number of posts per day
// User      -- Personal account, access to all boards, able to rate other posts, unlimited posts per day
// Admin     -- Admin panel, access to admin baord, can remove or pin any post, can ban or blacklist users
// Developer -- Can edit or remove any post or account, has access to dev panel

//region Anonymous Functions
// Performs a query on all active threads in a board, sorting by the specified parameter. Returns a list of 100 threads.
fastify.get('/catalog/{board}/{sort}/{dir}', async (req: any, res: any): Promise<void> => {
  db.collection(req.params.board).orderBy(req.params.sort, req.params.dir).get().then((snapshot: any): void => {
    const data = snapshot.docs.map((doc: any) => doc.data())
    res.send(data)
  })
})

// Creates a thread in the specified board.
fastify.post('/thread/create/{board}', async (req: any, res: any): Promise<void> => {
  await db.collection(req.params.board).add({

  })
})

// Creates a reply under the specified thread.
fastify.post('/reply/create/{thread}', async (req: any, res: any): Promise<void> => {

})
//endregion

//region User Functions
// Allows a user to edit a thread they previously made.
fastify.put('/thread/edit/{thread}', async (req: any, res: any): Promise<void> => {

})

fastify.delete('/thread/delete/{thread}', async (req: any, res: any): Promise<void> => {

})

// Allows a user to edit a reply they previously made.
fastify.put('/reply/edit/{reply}', async (req: any, res: any): Promise<void> => {

})
//endregion

//region Admin Functions
fastify.put('/user/ban/{id}', async (req: any, res: any): Promise<void> => {

})

fastify.post('/blacklist/{ip}', async (req: any, res: any): Promise<void> => {

})
//endregion

//region Developer Functions
// Used to test whether the backend is available. Sends out instance information.
fastify.get('/dev/test', async (req: any, res: any): Promise<void> => {
  if(verifyDeveloper(req)) {
    let timeActiveInMilliseconds = new Date() - instanceStartTime

    res.code(200).send({
      name: "Beatrice -- Forum2 Backend",
      instanceStartTime: instanceStartTime,
      timeActiveInMilliseconds: timeActiveInMilliseconds
    })
  }
  else res.code(403).send({ error: 'Invalid Credentials!' })
})

// Provides a list of all available routes and their information.
fastify.get('/dev/routes', async (req: any, res: any): Promise<void> => {
  if(verifyDeveloper(req)) res.code(200).send({ routes: fastify.routes })
  else res.code(403).send({ error: 'Invalid Credentials!' })
})

// Provides a status for each available route.
fastify.get('/dev/status', async (req: any, res: any): Promise<void> => {
  if(verifyDeveloper(req)) res.code(200).send({ routeStatus: this.stats() })
  else res.code(403).send({ error: 'Invalid Credentials!' })
})
//endregion

// Reroutes all requests to this cloud function through the Fastify instance.
exports.app = onRequest(async (req: any, res: any): Promise<void> => fastify.server.emit("request", req, res))
