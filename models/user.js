/** User class for message.ly */
const db = require("../db");
const bcrypt = require("bcrypt");
const {BCRYPT_WORK_FACTOR} = require("../config");
const ExpressError = require('../expressError');

/** User of the site. */

class User {
  constructor({username, password, first_name, last_name, phone}) {
    this.username = username;
    this.password = password;
    this.first_name = first_name;
    this.last_name = last_name;
    this.phone = phone;
  }

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) {
    //first hash the password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    // Insert user info into db
    const result = await db.query(`
      INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
      VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
      RETURNING username, first_name, last_name`, 
      [username, hashedPassword, first_name, last_name, phone]);
     //Get user info from our db query 
      const user = result.rows[0];
    //Use that info to create and return a new user
      return user;
   }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(`SELECT username, password FROM users WHERE username=$1`, [username]);
    let user = result.rows[0];
    let authentication = await bcrypt.compare(password, user.password);
    return authentication;
   }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(`UPDATE users SET last_login_at = current_timestamp WHERE username=$1 RETURNING username`,[username]);
    let user = result.rows[0];
    if(!user) throw new ExpressError(`User does not exist`, 404);
   }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const result = await db.query(`SELECT username, first_name, last_name, phone FROM users`);
    return result.rows;
   }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(`SELECT 
                                   username,
                                   first_name,
                                   last_name,
                                   phone,
                                   join_at,
                                   last_login_at
                                FROM users WHERE username = $1`, [username]);
    let user = result.rows[0];
    if(!user) throw new ExpressError(`User does not exist`, 404);
    return user;
   }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await db.query(`SELECT messages.id,
                                   messages.to_username,
                                   messages.body,
                                   messages.sent_at,
                                   messages.read_at,
                                   users.username,
                                   users.first_name,
                                   users.last_name,
                                   users.phone
                                   FROM messages
                                   JOIN users ON messages.to_username = users.username
                                   WHERE from_username=$1`, [username]);
    return result.rows;
   }

  /** Return messages to this user.
   *
   * [{id, from_username, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const result = await db.query(`SELECT messages.id,
                                   messages.from_username,
                                   messages.body, 
                                   messages.sent_at,
                                   messages.read_at,
                                   users.first_name,
                                   users.last_name,
                                   users.phone
                                   FROM messages
                                   JOIN users ON messages.from_username = users.username
                                   WHERE to_username=$1`,[username]);
    return result.rows;                             
   }
}


module.exports = User;