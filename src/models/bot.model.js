const db = require("../config/db.config");
const {
  getAllBots: getAllBotsQuery,
  createNewBot: createNewBotQuery,
  findByName: findByNameQuery,
  getAllTrainData: getAllTrainDataQuery,
  createTrainData: createTrainDataQuery,
  delBotById: delBotByIdQuery,
  delTrainDataByBotid: delTrainDataByBotidQuery,
  changeBotName: changeBotNameQuery,
  changeBotDescription: changeBotDescriptionQuery,
  getTrainDataById: getTrainDataByIdQuery,
  delTrainDataById: delTrainDataByIdQuery,
} = require("../database/queries");
const { logger } = require("../utils/logger");

class Bot {
  static create(newBot, cb) {
    const insertId = new Date().getTime();
    db.query(
      createNewBotQuery,
      [insertId, newBot.bot_name, newBot.img_url, newBot.description],
      (err, res) => {
        if (err) {
          logger.error(err.message);
          cb(err, null);
          return;
        }
        console.log(res);
        cb(null, {
          id: insertId,
          bot_name: newBot.bot_name,
          img_url: newBot.img_url,
          description: newBot.description,
        });
      }
    );
  }

  static getAll(cb) {
    db.query(getAllBotsQuery, (err, res) => {
      if (err) {
        logger.error(err.message);
        cb(err, null);
        return;
      }
      if (res.length) {
        cb(null, res);
        return;
      }
      cb({ kind: "not_found" }, null);
    });
  }

  static findByName(name, cb) {
    db.query(findByNameQuery, name, (err, res) => {
      if (err) {
        logger.error(err.message);
        cb(err, null);
        return;
      }
      if (res.length) {
        cb(null, res);
        return;
      }
      cb(null, null);
    });
  }

  static getAllTrainData(bot_id, cb) {
    db.query(getAllTrainDataQuery, bot_id, (err, res) => {
      if (err) {
        logger.error(err.message);
        cb(err, null);
        return;
      }
      if (res.length) {
        cb(null, res);
        return;
      }
      cb(null, null);
    });
  }

  static createTrainData(newTrainData, cb) {
    const newRecId = new Date().getTime();
    db.query(
      createTrainDataQuery,
      [
        newRecId,
        newTrainData.filename,
        newTrainData.originalname,
        newTrainData.doc_url,
        newTrainData.bot_id,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
      (err, res) => {
        if (err) {
          logger.error(err.message);
          cb(err, null);
          return;
        }
        cb(null, { id: newRecId });
      }
    );
  }

  static delBotById(bot_id, cb) {
    db.query(delTrainDataByBotidQuery, bot_id, (err, res) => {
      if (err) {
        logger.error(err.message);
        cb(err, null);
        return;
      }
      db.query(delBotByIdQuery, bot_id, (err1, res1) => {
        if (err1) {
          logger.error(err1.message);
          cb(err1, null);
          return;
        }
        cb(null, { message: "Delete ChatBot successfully" });
      });
    });
  }

  static changeBotName(data, cb) {
    db.query(changeBotNameQuery, [data.new_name, data.bot_id], (err, res) => {
      if (err) {
        logger.error(err.message);
        cb(err, null);
        return;
      }
      cb(null, { message: "success" });
    });
  }

  static changeBotDescription(data, cb) {
    db.query(
      changeBotDescriptionQuery,
      [data.new_description, data.bot_id],
      (err, res) => {
        if (err) {
          logger.error(err.message);
          cb(err, null);
          return;
        }
        cb(null, { message: "success" });
      }
    );
  }

  static getTrainDataById(data, cb) {
    db.query(getTrainDataByIdQuery, data, (err, res) => {
      if (err) {
        logger.error(err.message);
        cb(err, null);
        return;
      }
      if (res.length) {
        cb(null, res);
        return;
      }
      cb(null, null);
    });
  }

  static clearTrainDataByBotId(data, cb) {
    db.query(delTrainDataByBotidQuery, data, (err, res) => {
      if (err) {
        logger.error(err.message);
        cb(err, null);
        return;
      }
      cb(null, { message: "Delete all TrainData successfully" });
    });
  }

  static delTrainDataById(data, cb) {
    db.query(delTrainDataByIdQuery, data, (err, res) => {
      if (err) {
        logger.error(err.message);
        cb(err, null);
        return;
      }
      cb(null, { message: "Delete a TrainData successfully" });
    });
  }

  static siteEmbed(data, cb) {}
}

module.exports = Bot;

// .then(async (res) => {
//           console.log(res.data, "sdssssssssssssssssssssssssssssssssss");
//           const options = {
//             method: "GET",
//             url: "https://jsearch.p.rapidapi.com/search",
//             params: {
//               query: res.data.skills,
//               page: "1",
//               num_pages: "1",
//             },
//             headers: {
//               "X-RapidAPI-Key":
//                 "0e45ea3b0bmshce8ff617796788dp1058a9jsne9f3426cb3ff",
//               "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
//             },
//           };

//           const job = await axios.request(options);
//           console.log(job.data, "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
//         });
