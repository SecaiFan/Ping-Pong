const Router = require('express');
const router = Router.Router();
const gameRouter = require('./gameRouter');
const userRouter = require('./gameRouter');

router.get('/', (req, res) => {
    res.redirect(`${process.env.SERVER_HOST}game/begin_match`);
});

router.use('/game', gameRouter);
router.use('/user', userRouter);


module.exports = router;