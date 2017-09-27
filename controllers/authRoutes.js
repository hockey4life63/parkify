const passport = require('passport');
const express = require('express');
const router = express.Router();

const { userOrm } = require('../db');

//** CALLBACK PASSPORT ROUTES **//
router.get('/google/callback', passport.authenticate('google', {failureRedirect: '/fail'}), (req, res) => {
    res.redirect('/');
});

router.get('/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/',
    failureRedirect: '/fail'
}));

//** INITIAL AUTH ROUTES **//
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/facebook', passport.authenticate('facebook', {
    scope: ['public_profile', 'email']
}));

router.post('/signup', (req, res) => {
    // TODO: save new user
    userOrm.addNewUser(req.body.user).then(newUser => {
        res.json(newUser);
    });
});

router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

//** FETCH CURRENT USER FROM SESSION **//
router.get('/api/currentuser', userOrm.getCurrentUser);

module.exports = router;
