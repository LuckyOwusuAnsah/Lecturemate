import jwt from 'jsonwebtoken';
import { getJwtCookieOptions } from './cookieOptions.js';

const generateToken = (res, userId) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d'});

    res.cookie('jwt', token, {
        ...getJwtCookieOptions(),
        maxAge: 30 * 24 * 60 * 60 * 1000 //30days
    })

}


export default generateToken;