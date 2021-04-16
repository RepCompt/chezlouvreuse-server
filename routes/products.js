const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const verifyRole = require('../middleware/verifyRole');
const productsCtrl = require('../controllers/products');
const cors = require('cors');


router.get('/getTypes', productsCtrl.getTypesProducts);
router.post('/getSearchTypes', productsCtrl.getSearchTypes);
router.get('/getAllProducts', productsCtrl.getAllProducts);
router.post('/newProduct', verifyJWT, verifyRole, productsCtrl.newProduct);
router.post('/getProductsPref', productsCtrl.getProductsPref);
router.get('/getMarquesDispo', productsCtrl.getMarquesDispo);
router.post('/getModelesDispo', productsCtrl.getModelesDispo);
router.get('/getTypesDispo', productsCtrl.getTypesDispo);
router.post('/getProductInfo', productsCtrl.getProductInfo);
router.post('/editProduct', verifyJWT, verifyRole, productsCtrl.editProduct);
router.post('/deleteProduct', verifyJWT, verifyRole, productsCtrl.deleteProduct);
router.post('/getListProductsVendeur', verifyJWT, verifyRole, productsCtrl.getListProductsVendeur);

module.exports = router;