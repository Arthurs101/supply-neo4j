const gamesC = require('../controllers/gamesC')
const { Router } = require("express")
const router = Router();
router.post('/new', gamesC.newGame);
router.put('/edit/:gameId', gamesC.editGamefields);
router.delete('/delete/:gameId', gamesC.deleteGamefields);
router.delete('/deleteGames/:gameId', gamesC.deleteGame);
router.get('/allGames', gamesC.getGames);
router.get('/stores/:gameId', gamesC.getGamseStores);
router.get('/suppliers/:gameId', gamesC.getGamseSuppliers)
router.get('/search/:gameName', gamesC.getGameSearch);
module.exports = router;