import bcrypt            from 'bcrypt'
import { FastifyReply }  from 'fastify'
import { generateToken } from '../jwt.auth'

async function accountCheck(username: string): Promise<boolean> {
  const userCheck = await db.collection('users').where('username', '==', username).limit(1).get()
  return userCheck.exists
}

async function userAuthRoutes(fastify: any, opts: any) {
  const { db } = require('../lib/firestore')

  fastify.post('/register', async (req: any, res: FastifyReply): Promise<FastifyReply> => {
    let { username, password, email } = req.body

    if(!username || username.trim() === '') return res.code(400).send({ error: 'Invalid username!' })
    if(!password || password.trim() === '') return res.code(400).send({ error: 'Invalid password!' })
    if(!email || email.trim() === '')       return res.code(400).send({ error: 'Invalid email!' })

    if(accountCheck(username)) return res.code(400).send({ error: 'Username taken!' })

    try {
        password = bcrypt.hashSync(password, 8)

        await db.collection('users').add({
          username:  username,
          password:  password,
          email:     email,
          verifyKey: crypto.randomUUID().toString(),
          verified:  false
        })

        req.session.jwt = generateToken(username)
        return res.code(200).send({ registered: true })
    }
    catch (error) {
        return res.code(500).send({ error: 'Internal server error! Please try again later!' })
    }
  })

  fastify.post('/login', async (req: any, res: FastifyReply): Promise<FastifyReply> => {
    let { username, password } = req.body

    if(!username || username.trim() === '') return res.code(400).send({ error: 'Invalid username!' })
    if(!password || password.trim() === '') return res.code(400).send({ error: 'Invalid password!' })

    if(!accountCheck(username)) return res.code(400).send({ error: 'Invalid username!' })

    if(bcrypt.compareSync(password, userCheck.data().password)) {
        req.session.jwt = generateToken(username)
        return res.code(200).send({ loggedIn: true })
    }
    else return res.code(400).send({ error: 'Incorrect password!' })
  })

  fastify.get('/logout', async (req: any, res: FastifyReply): Promise<FastifyReply> => {
    req.session.destroy()
    return res.code(200).send({ loggedIn: false })
  })
}

module.exports = userAuthRoutes
