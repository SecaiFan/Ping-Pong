const UUID = require('uuid')

class gameController {
    async showMenu(req, res, next) {
        try {

            return res.render('index');
        } catch(e) {
            console.log(e);
            throw Error('Unknown Error');
        }
    }
    async congratulatePlayer() {

    }
}

module.exports = new gameController();