const Joi = require("joi");
const validatorHandler = require("../middlewares/validatorHandler");

const Bot = require("../models/bot.model");

const createBotParam = (req, res, next) => {
  console.log(req.body);
  const schema = Joi.object().keys({
    bot_name: Joi.string().trim().alphanum().min(3).max(20).required(),
    description: Joi.string().trim().alphanum().min(20).required(),
    // file: Joi.required(),
  });
  validatorHandler(req, res, next, schema);
};

const createBotExist = (req, res, next) => {
  Bot.findByName(req.body.bot_name, (err, data) => {
    if (err) {
      res.status(500).send({
        status: "error",
        message: err.message,
      });
    } else {
      if (data == null) {
        next();
      } else {
        res.status(409).send({
          status: "duplicate",
          data: {
            message: "Already Exists!",
          },
        });
        return;
      }
    }
  });
};

module.exports = {
  createBotParam,
  createBotExist,
};
