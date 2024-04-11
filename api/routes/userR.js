const usersC = require('../controllers/usersC')
const { Router } = require("express")
const router = Router();

router.post('/login' , usersC.login);
router.post('/signup', usersC.signup);
router.put('/',usersC.updateUser);
module.exports = router;