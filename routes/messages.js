const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require("../config");
const Message = require("../models/message");
const {ensureLoggedIn} = require("../middleware/auth");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', ensureLoggedIn, async(req, res, next) => {
    try{
        const { id } = req.params;
        const message = await Message.get(id);
        return res.json({message})
    } catch(e) {
        return next(e);
    }
});


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', ensureLoggedIn, async(req, res, next) => {
    try{
        const result = await Message.create({
            from_username : req.user.username,
            to_username: req.body.to_username,
            body: req.body.body
        });
        return res.json({message: result})
    } catch(e) {
        return next(e)
    }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', ensureLoggedIn, async(req, res, next) => {
    try{
        //store current username is a variable
        const currentUser = req.user.username;
        //get the message we're looking for
        const { id } = req.params;
        const message = Message.get(id);

        //check if to_user = currentUser, if not throw error else use Markread method
        if(message.to_username !== currentUser){
            throw new ExpressError("Cannot view this message", 401);
        }

        const readInfo = Message.markRead(id);
        return res.json(readInfo);
        
    } catch(e) {
        return next(e);
    }
})

 module.exports = router;
 //"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImVyaWNhIiwiaWF0IjoxNjI0NjM2NzM1fQ.Oz6Ftrm_idvuXzZpWkEp_uymWo7Qa_DLNEISyn7d7uU"

