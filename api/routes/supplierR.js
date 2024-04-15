const supplierC = require('../controllers/supplierC')
const { Router } = require("express")
const router = Router();
router.get('/all')
router.post('/new',supplierC.newSupplier);
router.post('/employ',supplierC.addEmployee)
router.get('/inventory',supplierC.getStock)
router.post('/inventory',supplierC.addToStock)
router.put('/inventory',supplierC.updateStock)	
router.delete('/inventory',supplierC.deleteFromStock)
module.exports = router