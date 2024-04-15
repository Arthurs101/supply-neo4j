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
module.exports = router;