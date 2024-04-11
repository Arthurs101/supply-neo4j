const usersC = require('../controllers/usersC')
const { Router } = require("express")
const router = Router();

router.post('/login' , usersC.login);

module.exports = router;