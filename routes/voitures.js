const express = require('express');
const router = express.Router();
const voituresCtrl = require('../controllers/voitures');


router.get('/getMarques', voituresCtrl.getMarques);
router.post('/getModel', voituresCtrl.getModel);
router.post('/getSearchSelected', voituresCtrl.getSearchSelected);
router.post('/getSearchMarques', voituresCtrl.getSearchMarques);

module.exports = router;