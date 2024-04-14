const platformR = require('../controllers/platformC')
const { Router } = require("express")
const router = Router();
router.post('/newPlatform', platformR.newPlatform);
router.put('/edit/:platformId', platformR.editPlatformfields);
router.delete('/delete/:platformId', platformR.deletePlatformfields);
router.delete('/deletePlatform/:platformId', platformR.deletePlatform);
router.get('/allPlatforms', platformR.getPlatforms);
module.exports = router;