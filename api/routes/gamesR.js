const gamesC = require('../controllers/gamesC')
const { Router } = require("express")
const router = Router();
router.post('/new', gamesC.newGame);
router.put('/edit/:gameId', gamesC.editGamefields);
router.delete('/delete/:gameId', gamesC.deleteGamefields);
module.exports = router;