const storesC = require('../controllers/storesC')
const { Router } = require("express")
const router = Router();

router.post('/new',storesC.newStore)
router.post('/employ',storesC.addEmployee)
router.get('/inventory',storesC.getStock)
router.post('/inventory',storesC.addToStock)
module.exports = router