const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const verifyIdAddress = require('../middleware/verifyIdAddress');
const verifyRole = require('../middleware/verifyRole');
const userCtrl = require('../controllers/user');


router.post('/register', userCtrl.createUser);
router.post('/login', userCtrl.loginUser);
router.get('/login', verifyJWT, userCtrl.isLogin);
router.post('/logout', userCtrl.logoutUser);
router.post('/editUser', verifyJWT, userCtrl.editUser);
router.post('/getListShippingAdresses', verifyJWT, userCtrl.getListShippingAdresses);
router.post('/updateDefaultAdresse', verifyJWT, userCtrl.updateDefaultAdresse);
router.post('/getAddressInfo', verifyJWT, verifyIdAddress, userCtrl.getAddressInfo);
router.post('/getAddressDefault', verifyJWT, userCtrl.getAddressDefault);
router.post('/editAddress', verifyJWT, verifyIdAddress, userCtrl.editAddress);
router.post('/newAddress', verifyJWT, userCtrl.newAddress);
router.post('/deleteAddress', verifyJWT, verifyIdAddress, userCtrl.deleteAddress);
router.post('/addKeysStripe', verifyJWT, verifyRole, userCtrl.addKeysStripe);

module.exports = router;