const User = require("../models/user.model");
const {
  hash: hashPassword,
  compare: comparePassword,
} = require("../utils/password");
const { generate: generateToken } = require("../utils/token");

exports.signup = (req, res) => {
  const { firstname, lastname, email, password } = req.body;
  const hashedPassword = hashPassword(password.trim());

  const user = new User(
    firstname.trim(),
    lastname.trim(),
    email.trim(),
    hashedPassword
  );

  User.create(user, (err, data) => {
    if (err) {
      res.status(500).send({
        status: "error",
        message: err.message,
      });
    } else {
      const token = generateToken(data.id);
      res.status(201).send({
        status: "success",
        data: {
          token,
          data,
        },
      });
    }
  });
};

// exports.signin = (req, res) => {
//   const { email, password } = req.body;
//   User.findByEmail(email.trim(), (err, data) => {
//     if (err) {
//       if (err.kind === "not_found") {
//         res.status(404).send({
//           status: "error",
//           message: `User with email ${email} was not found`,
//         });
//         return;
//       }
//       res.status(500).send({
//         status: "error",
//         message: err.message,
//       });
//       return;
//     }
//     if (data) {
//       if (comparePassword(password.trim(), data.password)) {
//         const token = generateToken(data.id);
//         res.status(200).send({
//           status: "success",
//           data: {
//             token,
//             firstname: data.firstname,
//             lastname: data.lastname,
//             email: data.email,
//           },
//         });
//         return;
//       }
//       res.status(401).send({
//         status: "error",
//         message: "Incorrect password",
//       });
//     }
//   });
// };

exports.signin = (req, res) => {
  const { password } = req.body;
  // console.log("hashpwd:::  ", hashPassword(password.trim()));
  User.findAdmin((err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        res.status(404).send({
          status: "error",
          message: `The admin was not found`,
        });
        return;
      }
      res.status(500).send({
        status: "error",
        message: err.message,
      });
      return;
    }
    if (data) {
      if (comparePassword(password.trim(), data.password)) {
        const token = generateToken(data.id);
        res.status(200).send({
          status: "success",
          data: {
            token,
            firstname: data.firstname,
            lastname: data.lastname,
            email: data.email,
          },
        });
        return;
      }
      res.status(401).send({
        status: "error",
        message: "Incorrect password",
      });
    }
  });
};

exports.getAdminEmail = (req, res) => {
  User.findAdmin((err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        res.status(404).send({
          status: "error",
          message: `The admin was not found`,
        });
        return;
      }
      res.status(500).send({
        status: "error",
        message: err.message,
      });
      return;
    }
    if (data) {
      res.status(200).send({
        status: "success",
        data: {
          email: data.email,
        },
      });
      return;
    }
  });
};

exports.updateProfile = (req, res) => {
  const { email, firstname, lastname } = req.body;
  User.updateProfile(
    [email.trim(), firstname.trim(), lastname.trim()],
    (err, data) => {
      if (err) {
        if (err.kind === "not_found") {
          res.status(404).send({
            status: "error",
            message: `The admin was not found`,
          });
          return;
        }
        res.status(500).send({
          status: "error",
          message: err.message,
        });
        return;
      }
      if (data) {
        res.status(200).send({
          status: "success",
          data: {
            email: data.email,
            firstname: data.firstname,
            lastname: data.lastname,
          },
        });
        return;
      }
    }
  );
};

exports.updatePassword = (req, res) => {
  const { oldP, newP } = req.body;
  User.findAdmin((err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        res.status(404).send({
          status: "error",
          message: `The admin was not found`,
        });
        return;
      }
      res.status(500).send({
        status: "error",
        message: err.message,
      });
      return;
    }
    if (data) {
      if (comparePassword(oldP.trim(), data.password)) {
        const hashedNewPwd = hashPassword(newP.trim());
        User.updatePassword(hashedNewPwd, (err, data) => {
          if (err) {
            if (err.kind === "not_found") {
              res.status(404).send({
                status: "error",
                message: `The admin was not found`,
              });
              return;
            }
            res.status(500).send({
              status: "error",
              message: err.message,
            });
            return;
          }
          if (data) {
            res.status(200).send({
              status: "success",
              data: {},
            });
            return;
          }
        });
        return;
      }

      res.status(401).send({
        status: "error",
        message: "Incorrect old password",
      });
    }
  });
};
