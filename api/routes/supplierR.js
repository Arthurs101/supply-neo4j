const supplierC = require('../controllers/supplierC')
const { Router } = require("express")
const router = Router();
router.get('/all',supplierC.getSuppliers)
router.post('/new',supplierC.newSupplier);
router.post('/employ',supplierC.addEmployee)
router.get('/inventory',supplierC.getStock)
router.post('/inventory',supplierC.addToStock)
router.put('/inventory',supplierC.updateStock)	
router.delete('/inventory',supplierC.deleteFromStock)
router.get('/search/:supplierName',supplierC.getSupplierSearch)
module.exports = router