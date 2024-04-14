const genreC = require('../controllers/genreC');
const { Router } = require("express")
const router = Router();
router.post('/newGenre', genreC.newGenre);
router.put('/edit/:genreId', genreC.editGenrefields);
router.delete('/delete/:genreId', genreC.deleteGenrefields);
router.delete('/deleteGenre/:genreId', genreC.deleteGenre);
router.get('/allGenres', genreC.getGenres);
module.exports = router;