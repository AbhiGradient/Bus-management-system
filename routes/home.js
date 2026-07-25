const express = require('express');
const router = express.Router();

router.get('/help-center', (req, res) => {
    res.render('home/help-center');
});
router.get('/safety-guidelines', (req, res) => {
    res.render('home/safety-guidelines');
});
router.get('/privacy-policy', (req, res) => {
    res.render('home/privacy-policy');
});
router.get('/terms', (req, res) => {
    res.render('home/terms');
});
router.get('/about', (req, res) => {
    res.render('home/about');
});

module.exports = router;