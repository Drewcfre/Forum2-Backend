import 'dotenv/config'
import jwt from 'jsonwebtoken'

async function verifyToken(req: any): Promise<string | undefined> {
  let secret = process.env.JWT_SECRET_KEY
  if (!secret || secret.trim() === '') {
    console.log('JWT secret key is not set in environment variables!')
    return ''
  }

  let header = process.env.TOKEN_HEADER_KEY
  if (!header || header.trim() === '') {
      console.log('Token header key is not set in environment variables!')
      return ''
  }

  try {
      const token = req.session.jwt;
      if (!token || token.trim() === '') {
          console.log('Token was not found!')
          return ''
      }

      const verified = jwt.verify(token, jwtSecretKey) as { username: string }
      if (verified) return verified.username
      else return ''
  }
  catch (error) {
      console.error('Error verifying token:', error)
      return ''
  }
}

async function verifyDeveloper(req: any): Promise<boolean | undefined> {

}

export { verifyToken, verifyDeveloper }
