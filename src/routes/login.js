const express = require('express');
const LoginController = require('../controllers/LoginController');

const router = express.Router();

//Mierda que agregué para que se pudieran ver las vistas que hice
router.get('/hmenu', (req,res) =>{
    res.render('hmenu');
});
router.get('/creditos', (req,res) =>{
    res.render('creditos');
});
///////////////////////////////////////////////////////////////////

router.get('/creditos');
router.get('/login', LoginController.login);
router.post('/login', LoginController.auth);
router.get('/register', LoginController.register);
router.post('/register', LoginController.storeUser);
router.get('/logout', LoginController.logout);
router.get('/credito', LoginController.credito);
router.post('/loan-estimate', LoginController.loanEstimate);
router.post('/solicitar', LoginController.solicitar);
router.get('/solicitar', LoginController.solicitar);

router.get('/tabla', LoginController.tabla);

router.get('/tablaC', LoginController.tablaC);

router.post('/delete', LoginController.destroy);
router.get('/edit/:id', LoginController.edit);
router.post('/edit/:id', LoginController.update);

router.post('/create', LoginController.store);

module.exports = router;