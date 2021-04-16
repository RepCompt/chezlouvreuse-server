const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const verifyRole = require('../middleware/verifyRole');
const purchaseCtrl = require('../controllers/purchase');


router.post('/addToCart', verifyJWT, purchaseCtrl.addToCart);
router.get('/getArticlesInCart', verifyJWT, purchaseCtrl.getArticlesInCart);
router.post('/deleteProduct', verifyJWT, purchaseCtrl.deleteProduct);
router.post('/modifyQtePanier', verifyJWT, purchaseCtrl.modifyQtePanier);
router.get('/calculPrices', verifyJWT, purchaseCtrl.calculPrices);
router.post('/charge', verifyJWT, purchaseCtrl.charge);
router.get('/getListSales', verifyJWT, verifyRole, purchaseCtrl.getListSales);
router.get('/getListOrders', verifyJWT, purchaseCtrl.getListOrders);

module.exports = router;