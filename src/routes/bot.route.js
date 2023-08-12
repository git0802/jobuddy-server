const router = require("express").Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { asyncHandler } = require("../middlewares/asyncHandler");
const botController = require("../controllers/bot.controller");

const Bot = require("../models/bot.model");

const { PUBLIC_URL } = require("../utils/secrets");

const data = "";

const storageImgWithValidator = multer.diskStorage({
  destination: (req, file, callBack) => {
    var dir = path.join(__dirname, PUBLIC_URL + req.body.bot_name);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    callBack(null, dir);
  },
  filename: (req, file, callBack) => {
    callBack(null, "index" + path.extname(file.originalname));
  },
});
let uploadImgWithValidator = multer({
  fileFilter: function (req, file, callback) {
    if (!req.body.bot_name || !req.body.description)
      return callback(new Error("Parameter Error"));
    Bot.findByName(req.body.bot_name, (err, data) => {
      if (err) {
        return callback(new Error(err.message));
      } else {
        if (data == null) {
          var ext = path.extname(file.originalname);
          if (ext !== ".png") {
            return callback(new Error("Only .png is allowed"));
          }
          return callback(null, true);
        } else {
          console.log("req.body::: ", req.body);
          return callback(new Error("Already Exists!"));
        }
      }
    });
  },
  storage: storageImgWithValidator,
});

const storageDoc = multer.diskStorage({
  destination: (req, file, callBack) => {
    var dir = path.join(
      __dirname,
      PUBLIC_URL + req.body.namespace + "/traindatas"
    );
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    callBack(null, dir);
  },
  filename: (req, file, callBack) => {
    callBack(null, new Date().getTime() + path.extname(file.originalname));
  },
});
let uploadDoc = multer({
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== ".pdf" && ext !== ".docx" && ext !== ".txt") {
      return callback(new Error("Not Allowed file"));
    }
    callback(null, true);
  },
  storage: storageDoc,
});

const storageImg = multer.diskStorage({
  destination: (req, file, callBack) => {
    var dir = path.join(__dirname, PUBLIC_URL + req.body.bot_name);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    callBack(null, dir);
  },
  filename: (req, file, callBack) => {
    callBack(null, "index" + path.extname(file.originalname));
  },
});
let uploadImg = multer({
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== ".png") {
      return callback(new Error("Only .png is allowed"));
    }
    return callback(null, true);
  },
  storage: storageImg,
});

router
  .route("/create")
  .post(
    [uploadImgWithValidator.single("file")],
    asyncHandler(botController.create)
  );

router.route("/getAll").get(asyncHandler(botController.getAll));

router
  .route("/traindata/getAll")
  .post(asyncHandler(botController.getAllTrainData));

router
  .route("/traindata/upload")
  .post(
    [uploadDoc.single("file")],
    asyncHandler(botController.uploadTrainData)
  );

router.route("/getDOCfolder").post(asyncHandler(botController.getDOCfolder));

router.route("/delBotById").post(asyncHandler(botController.delBotById));

router.route("/changeBotName").post(asyncHandler(botController.changeBotName));

router
  .route("/changeBotDescription")
  .post(asyncHandler(botController.changeBotDescription));

router
  .route("/changeBotImg")
  .post(uploadImg.single("file"), asyncHandler(botController.changeBotImg));

router
  .route("/getTrainDataById")
  .post(asyncHandler(botController.getTrainDataById));

router
  .route("/delTrainDataById")
  .post(asyncHandler(botController.delTrainDataById));

router
  .route("/clearTrainDataByBotId")
  .post(asyncHandler(botController.clearTrainDataByBotId));

router.route("/siteEmbed").post(asyncHandler(botController.siteEmbed));

router.route("/validUrl").post(asyncHandler(botController.validUrl));

router.route("/getReply").post(asyncHandler(botController.getReply));

router.route("/getReplyQA").post(asyncHandler(botController.getReplyQA));

router.route("/jobsearch").post(asyncHandler(botController.jobsearch));

router
  .route("/jobsearchindeed")
  .post(asyncHandler(botController.jobsearchindeed));

module.exports = router;
