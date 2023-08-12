const db = require("../config/db.config");
const {
  createNewUser: createNewUserQuery,
  findUserByEmail: findUserByEmailQuery,
  findAdmin: findAdminQuery,
  updateProfile: updateProfileQuery,
  updatePassword: updatePasswordQuery,
} = require("../database/queries");
const { logger } = require("../utils/logger");

class User {
  constructor(firstname, lastname, email, password) {
    this.firstname = firstname;
    this.lastname = lastname;
    this.email = email;
    this.password = password;
  }

  static create(newUser, cb) {
    db.query(
      createNewUserQuery,
      [newUser.firstname, newUser.lastname, newUser.email, newUser.password],
      (err, res) => {
        if (err) {
          logger.error(err.message);
          cb(err, null);
          return;
        }
        cb(null, {
          id: res.insertId,
          firstname: newUser.firstname,
          lastname: newUser.lastname,
          email: newUser.email,
        });
      }
    );
  }

  static findByEmail(email, cb) {
    db.query(findUserByEmailQuery, email, (err, res) => {
      if (err) {
        logger.error(err.message);
        cb(err, null);
        return;
      }
      if (res.length) {
        cb(null, res[0]);
        return;
      }
      cb({ kind: "not_found" }, null);
    });
  }

  static findAdmin(next) {
    db.query(findAdminQuery, (err, res) => {
      if (err) {
        logger.error(err.message);
        next(err, null);
        return;
      }
      if (res.length) {
        next(null, res[0]);
        return;
      }
      next({ kind: "not_found" }, null);
    });
  }

  static updateProfile(data, next) {
    db.query(updateProfileQuery, [data[1], data[2], data[0]], (err, res) => {
      if (err) {
        logger.error(err.message);
        next(err, null);
        return;
      }
      if (res.length) {
        next(null, res[1][0]);
        return;
      }
      next({ kind: "not_found" }, null);
    });
  }

  static updatePassword(data, next) {
    db.query(updatePasswordQuery, data, (err, res) => {
      if (err) {
        logger.error(err.message);
        next(err, null);
        return;
      }
      next(null, res);
      return;
    });
  }
}

module.exports = User;
