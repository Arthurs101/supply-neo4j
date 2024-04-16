const gamesC = require('../controllers/gamesC')
const { Router } = require("express")
const router = Router();
router.post('/new', gamesC.newGame);
router.put('/edit/:gameId', gamesC.editGamefields);
router.delete('/delete/:gameId', gamesC.deleteGamefields);
router.delete('/deleteGames/:gameId', gamesC.deleteGame);
router.get('/allGames', gamesC.getGames);
router.get('/:gameId', gamesC.getGameById);
router.post('/:gameId/addGenre/:genreId', gamesC.addGenreToGame);
router.delete('/:gameId/removeGenre/:genreId', gamesC.removeGenreFromGame);
router.get('/:gameId/genres', gamesC.getGenresOfGame);
router.post('/:gameId/addPlatform/:platformId', gamesC.addPlatformToGame);
router.delete('/:gameId/removePlatform/:platformId', gamesC.removePlatformFromGame);
router.get('/:gameId/platforms', gamesC.getPlatformsOfGame);
router.post('/:gameId/addTag/:tagId', gamesC.addTagformGame);
router.get('/:gameId/tags', gamesC.getTagformsOfGame);
router.delete('/:gameId/removeTag/:tagId', gamesC.removeTagFromGame);
router.get('/stores/:gameId', gamesC.getGamseStores);
router.get('/suppliers/:gameId', gamesC.getGamseSuppliers)
router.get('/search/:gameName', gamesC.getGameSearch);
module.exports = router;