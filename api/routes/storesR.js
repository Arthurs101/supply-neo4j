const storesC = require('../controllers/storesC')
const { Router } = require("express")
const router = Router();

router.get('/all',storesC.getStores);
router.post('/new',storesC.newStore)
router.post('/employ',storesC.addEmployee)
router.get('/inventory',storesC.getStock)
router.post('/inventory',storesC.addToStock)
router.delete('/inventory',storesC.deleteFromStock)
module.exports = router