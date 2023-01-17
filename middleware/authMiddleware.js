const jwt = require('jsonwebtoken');
const User = require("../models/userModel");
const {Chat} = require("../models/chatModel");
const ApiError = require("../error/apiError");

module.exports = async function (req, res, next) {
    if(req.method === 'OPTIONS') {
        next();
    }
    try {
        const token = req.headers.authorization.split(' ')[1];
        const id = +req.url.slice(1);
        console.log('-----Middleware-----')
        console.log('Cookies: ', req.cookies);
        console.log('url: ', req.params, 'id:', id);
        if(!token) {
            return res.redirect('user/entry');
        } else {
            const userData = jwt.verify(token, process.env.SECRET_KEY);
            if (!userData) {
                return next(new Error('Требуется подтверждение аккаунта'));
            }
            console.log(userData);
            req.user = userData;
            console.log('-----Middleware-----')
            next();
        }
    } catch(e) {
        console.log('-----Middleware-----')
        return Error("Пользователь не авторизован");
    }
};