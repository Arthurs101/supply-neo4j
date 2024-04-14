const tagsC = require('../controllers/tagsC')
const { Router } = require("express")
const router = Router();
router.post('/newTag', tagsC.newTag);
router.put('/edit/:tagId', tagsC.editTagfields);
router.delete('/delete/:tagId', tagsC.deleteTagfields);
router.delete('/deleteTags/:tagId', tagsC.deleteTag);
router.get('/allTags', tagsC.getTags);
module.exports = router;