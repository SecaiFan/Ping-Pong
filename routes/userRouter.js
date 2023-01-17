const Router = require('express');
const router = new Router.Router();
const UserController = require('../controllers/userController');

router.get('/entry');
router.post('/entry');
router.get('/exit');

module.exports = router;