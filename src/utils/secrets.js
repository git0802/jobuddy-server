require("dotenv/config");

const { logger } = require("./logger");

const {
  DB_HOST,
  DB_USER,
  DB_PASS,
  DB_NAME,
  JWT_SECRET_KEY,
  PORT,
  PUBLIC_URL,
  OPENAI_API_KEY,
  PINECONE_API_KEY,
  PINECONE_ENVIRONMENT,
  PINECONE_INDEX_NAME,
} = process.env;

const requiredCredentials = [
  "DB_HOST",
  "DB_USER",
  "DB_PASS",
  "DB_NAME",
  "JWT_SECRET_KEY",
  "PORT",
  "PUBLIC_URL",
  "OPENAI_API_KEY",
  "PINECONE_API_KEY",
  "PINECONE_ENVIRONMENT",
  "PINECONE_INDEX_NAME",
];

for (const credential of requiredCredentials) {
  if (process.env[credential] === undefined) {
    logger.error(`Missing required crendential: ${credential}`);
    process.exit(1);
  }
}

module.exports = {
  DB_HOST,
  DB_USER,
  DB_PASS,
  DB_NAME,
  JWT_SECRET_KEY,
  PORT,
  PUBLIC_URL,
  OPENAI_API_KEY,
  PINECONE_API_KEY,
  PINECONE_ENVIRONMENT,
  PINECONE_INDEX_NAME,
};
