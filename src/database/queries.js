const { DB_NAME } = require("../utils/secrets");

const createDB = `CREATE DATABASE IF NOT EXISTS ${DB_NAME}`;

const dropDB = `DROP DATABASE IF EXISTS ${DB_NAME}`;

const createTableUSers = `
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    firstname VARCHAR(50) NULL,
    lastname VARCHAR(50) NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_on TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
)
`;

const createNewUser = `
INSERT INTO users VALUES(null, ?, ?, ?, ?, NOW())
`;

const findUserByEmail = `
SELECT * FROM users WHERE email = ?
`;

const findAdmin = `
SELECT * FROM users
`;

const updateProfile = `
UPDATE users SET firstname=?, lastname=?, email=?;
SELECT * FROM users;
`;

const updatePassword = `
UPDATE users SET password=?
`;

const getAllBots = `
SELECT * FROM bots
`;

const createNewBot = `
INSERT INTO bots VALUES(?, ?, ?, ?,(SELECT email FROM users), NOW());
`;

const findByName = `
SELECT * FROM bots WHERE bot_name = ?
`;

const getAllTrainData = `
SELECT * FROM traindatas 
`;

const createTrainData = `
INSERT INTO traindatas VALUES(?, ?, ?, ?, ?,?,?,?,?,?,?,?,?,?,?,?, (SELECT email FROM users), NOW());
`;

const delBotById = `
DELETE FROM bots WHERE id = ?
`;

const delTrainDataByBotid = `
DELETE FROM traindatas WHERE bot_id = ?
`;

const changeBotName = `
UPDATE bots SET bot_name = ? WHERE id = ?;
`;

const changeBotDescription = `
UPDATE bots SET description = ? WHERE id = ?;
`;

const getTrainDataById = `
SELECT * FROM traindatas WHERE id = ?
`;

const delTrainDataById = `
DELETE FROM traindatas WHERE id = ?
`;

module.exports = {
  createDB,
  dropDB,
  createTableUSers,
  createNewUser,
  findUserByEmail,
  findAdmin,
  updateProfile,
  updatePassword,
  getAllBots,
  createNewBot,
  findByName,
  getAllTrainData,
  createTrainData,
  delBotById,
  delTrainDataByBotid,
  changeBotName,
  changeBotDescription,
  getTrainDataById,
  delTrainDataById,
};
