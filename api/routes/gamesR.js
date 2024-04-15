const gamesC = require('../controllers/gamesC')
const { Router } = require("express")
const router = Router();
router.post('/new', gamesC.newGame);
router.put('/edit/:gameId', gamesC.editGamefields);
router.delete('/delete/:gameId', gamesC.deleteGamefields);
router.delete('/deleteGames/:gameId', gamesC.deleteGame);
router.get('/allGames', gamesC.getGames);
router.get('/:gameId', gamesC.getGameById);


// Ruta para agregar un género a un juego
router.post('/:gameId/addGenre/:genreId', gamesC.addGenreToGame);

// Ruta para eliminar la relación de un juego con un género
router.delete('/:gameId/removeGenre/:genreId', gamesC.removeGenreFromGame);

// Ruta para obtener los géneros de un juego
router.get('/:gameId/genres', gamesC.getGenresOfGame);

// Ruta para agregar una plataforma a un juego
router.post('/:gameId/addPlatform/:platformId', gamesC.addPlatformToGame);

// Ruta para eliminar la relación de un juego con una plataforma
router.delete('/:gameId/removePlatform/:platformId', gamesC.removePlatformFromGame);

// Ruta para obtener las plataformas de un juego
router.get('/:gameId/platforms', gamesC.getPlatformsOfGame);

// ruta para agregar un tag a un juego
router.post('/:gameId/addTag/:tagId', gamesC.addTagformGame);

//Ruta para obtener los tags de un juego
router.get('/:gameId/tags', gamesC.getTagformsOfGame);

// Ruta para eliminar los tags de un juego
router.delete('/:gameId/removeTag/:tagId', gamesC.removeTagFromGame);


module.exports = router;