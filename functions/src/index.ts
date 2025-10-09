import admin from 'firebase-admin';
import {onRequest} from 'firebase-functions/https';

import { fastify } from './fastify.config'
import { verifyToken, verifyDeveloper } from './jwt.auth'



const instanceStartTime = new Date()

admin.initializeApp();
const db = admin.firestore();



// Access Levels
// Anonymous -- No account. Has access to limited boards, cannot rate posts, and can only make a couple threads and replies a day.
// User -- Has access to all boards, rating, and can make unlimited posts. Users require verification.
// Admin -- Can remove any post, ban users, and blacklist IPs. Admin posts can be pinned. Admins can only be added by Developers.
// Developer -- Can edit any and all posts as well as user accounts. Developers are hardcoded into the backend.

//region Anonymous Functions
//
fastify.get('/catalog/{board}/{sort}/{desc}', async (req: any, res: any): Promise<void> => {
  db.collection(req.params.board).orderBy("createdAt", "desc").get().then((snapshot: any): void => {
    const data = snapshot.docs.map((doc: any) => doc.data());
    res.send(data);
  });
});

fastify.post('/create/{board}', async (req: any, res: any): Promise<void> => {
})

fastify.delete('/delete/{thread}')
//endregion

//region User Functions

//TODO: Add user functions here later.

//endregion

//region Admin Functions

//TODO: Add admin functions here later.

//endregion

//region Developer Functions
// Used to test whether the backend is available. Sneds out instance information.
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
