const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");

const authRoute = require("./routes/auth.route");
const botRoute = require("./routes/bot.route");

const { httpLogStream } = require("./utils/logger");

const app = express();
const User = require("./models/user.model");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));
app.use(morgan("combined", { stream: httpLogStream }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/auth", authRoute);
app.use("/api/bot", botRoute);
app.get("/api/test", (req, res) => {
  res.send("success")
})

app.get("/", (req, res) => {
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
      return res.status(200).send({
        status: "success",
        data: {
          firstname: data.firstname,
          lastname: data.lastname,
          email: data.email,
        },
      });
    }
  });
});

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).send({
    status: "error",
    message: err.message,
  });
  next();
});

module.exports = app;
