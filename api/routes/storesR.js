const storesC = require('../controllers/storesC')
const { Router } = require("express")
const router = Router();

router.post('/new',storesC.newStore)
router.post('/employ',storesC.addEmployee)
module.exports = router