const Router = require('express');
const router = new Router.Router();
const gameController = require('../controllers/gameController');

router.get('/main_menu');
router.get('/lobby:id');
router.get('/begin_match/:id', gameController.showMenu);
router.get('/end_match', gameController.congratulatePlayer);

module.exports = router;