const bcrypt = require('bcrypt');
const {validationResult} = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/models');
const ApiError = require('../error/apiError');

const generateJWT = function(id, login, role) {
    return jwt.sign(
        {id: id, login: login, role: role},
        process.env.SECRET_KEY,
        {expiresIn: '24h'},
    );
};

class UserController {
    async registration(req, res, next) {
        try {

            console.log(req.body);
            const {nickname} = req.body;
            if(!nickname) {
                return res.status(520).json({message:"Unknown error!"});
            }
            const candidate = await User.findOne({where: {login: login}});
            if (candidate) {
                return res.render('registration', {
                    userExist: true,
                    msg: "Пользователь с таким именем уже существует",
                    layout: false,
                });
            }
            if (password !== rep_password) {
                return res.render('registration', {
                    unMatch: true,
                    msg: "Введённые пароли не совпадают",
                    layout: false,
                });
            }
            const hashPassword = await bcrypt.hash(password, 5);
            let user = await User.create({login, role, password: hashPassword});
            const token = generateJWT(user.id, user.login, user.role);
            await User.update({token: token}, {where: {
                    login: user.login
                }});
            return res.status(303).cookie('token', token, {
                maxAge: 3600*1000,
                secure: true,
                httpOnly: true
            }).redirect('greet');
        } catch(e) {
            console.log(e);
            res.status(500).json({message:"Registration error!"});
        }
    }
    async login(req, res, next) {
        try {
            const errors = validationResult(req);
            if(!errors.isEmpty()) {
                const fstError = errors.array({ onlyFirstError: true })[0];
                console.log(fstError);
                return res.render('login', {
                    error: true,
                    msg: fstError.msg,
                    layout: false,
                });
            }
            const {login, password} = req.body;
            if(!login || !password) {
                return next(ApiError.badRequest("Некорректный login или password!"));
            }
            const user = await User.findOne({where: {login: login}});
            let comparePassword;
            if(user) comparePassword = await bcrypt.compare(password, user.password);
            if (!user || !comparePassword) {
                return res.render('login', {
                    userCheck: true,
                    msg: "Неверный логин или пароль",
                    layout: false,
                });
            }
            const token = generateJWT(user.id, user.login, user.role);
            await User.update({token: token}, {where: {
                    login: user.login
                }});
            return res.status(303).cookie('token', token, {
                maxAge: 3600*1000,
                secure: true,
                httpOnly: true
            }).redirect('greet');
        } catch(e) {
            console.log(e);
            res.status(500).json({message:"Login error!"});
        }
    }
    async logout(req, res) {
        try {
            const login = req.login;
            await User.update({token: null}, {where: {
                    login: login
                }});
            res.clearCookie('token');
            return res.redirect('registration');
        } catch(e) {
            console.log(e);
            res.status(500).json({message:"Logout error!"});
        }
    }
    async sendCandidatesData(req, res) {
        return res.render('registration', {layout: false});
    }
    async sendUserData(req, res) {
        res.render('login', {layout: false});
    }
    async greetingUser(req, res) {
        console.log(req.cookies);
        return res.render('greeting', {
            layout: false,
            user: req.login,
        });
    }
}

module.exports = new UserController();