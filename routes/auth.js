const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const User = require("../models/user");

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post('/login', async (req, res, next) => {
    try{
        const { username, password } = req.body;
        if(!username || !password){
            throw new ExpressError("Username and password required", 400);
        }
        //authenticate user with User method
        if(await User.authenticate(username,password)){
            //create json web token 
            let token = jwt.sign({username}, SECRET_KEY);
            //update login timestamp
            User.updateLoginTimestamp(username);
            return res.json({token});
        } else {
            throw new ExpressError("Invalid username/password", 400);
        }
    } catch(e) {
        return next(e);
    }
});


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post('/register', async (req, res, next) => {
    try{
        //register user with User method
        const { username } = await User.register(req.body);
        //create json web token
        let token = jwt.sign({ username }, SECRET_KEY);
        //update login time
        User.updateLoginTimestamp(username);
        return res.json({token});
    } catch(e) {
        return next(e);
    }
})

 module.exports = router;


