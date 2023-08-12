const PineconeClient = require("@pinecone-database/pinecone").PineconeClient;
const PDFLoader = require("langchain/document_loaders/fs/pdf").PDFLoader;
const DocxLoader = require("langchain/document_loaders/fs/docx").DocxLoader;
const TextLoader = require("langchain/document_loaders/fs/text").TextLoader;
const RecursiveCharacterTextSplitter =
  require("langchain/text_splitter").RecursiveCharacterTextSplitter;
const Document = require("langchain/document").Document;
const OpenAIEmbeddings =
  require("langchain/embeddings/openai").OpenAIEmbeddings;
const PineconeStore = require("langchain/vectorstores/pinecone").PineconeStore;
const { loadQAChain } = require("langchain/chains");
const OpenAI = require("langchain/llms/openai").OpenAI;
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const url = require("url");
const cheerio = require("cheerio");
const Bot = require("../models/bot.model");
const { Configuration, OpenAIApi } = require("openai");
const fetch = require("node-fetch");
const natural = require("natural");
const stopwords = require("natural").stopwords;
const {
  PUBLIC_URL,
  PINECONE_API_KEY,
  PINECONE_ENVIRONMENT,
  PINECONE_INDEX_NAME,
  OPENAI_API_KEY,
} = require("../utils/secrets");

const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

let filename = null;
let originalname = null;
let doc_url = null;
let bot_id = null;
let doc_type = null;

function fileLoad(fileName, srcUrl) {
  //Determine file's extension
  const extensionName = path.extname(fileName);

  let loader;
  if (extensionName === ".pdf") {
    loader = new PDFLoader(path.join(__dirname, PUBLIC_URL + srcUrl), {
      splitPages: false,
      pdfjs: () => import("pdf-parse/lib/pdf.js/v1.9.426/build/pdf.js"),
    });
  } else if (extensionName === ".docx") {
    loader = new DocxLoader(path.join(__dirname, PUBLIC_URL + srcUrl));
  } else {
    loader = new TextLoader(path.join(__dirname, PUBLIC_URL + srcUrl));
  }

  return loader;
}

exports.getAll = (req, res) => {
  Bot.getAll((err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        res.status(404).send({
          status: "error",
          message: `There are no bots`,
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
          bots: data,
        },
      });
      return;
    }
  });
};

exports.create = (req, res, next) => {
  const file = req.file;
  if (!file) {
    const error = new Error("No File");
    error.httpStatusCode = 400;
    return next(error);
  }
  console.log("here is controller createBot");
  Bot.create(
    {
      bot_name: req.body.bot_name,
      description: req.body.description,
      img_url: `/${req.body.bot_name}/${file.filename}`,
    },
    (err, data) => {
      if (err) {
        res.status(500).send({
          status: "error",
          message: err.message,
        });
      } else {
        res.status(200).send({
          status: "success",
          data: {
            id: data.id,
            bot_name: data.bot_name,
            description: data.description,
            img_url: data.img_url,
          },
        });
      }
    }
  );
};

exports.getAllTrainData = (req, res, next) => {
  const bot_id = req.body.bot_id;
  if (!bot_id) return res.status(404).json({ message: "Parameter Error" });
  Bot.getAllTrainData(bot_id, (err, data) => {
    if (err) {
      res.status(500).send({
        status: "error",
        message: err.message,
      });
    } else {
      if (data == null) {
        res.status(404).send({
          status: "not found",
          data: {
            message: "Nothing!",
          },
        });
      } else {
        res.status(200).send({
          status: "success",
          data: {
            trainData: data,
          },
        });
      }
    }
  });
};

exports.uploadTrainData = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      const error = new Error("No File");
      error.httpStatusCode = 400;
      return next(error);
    }
    const namespace = req.body.namespace;
    filename = file.filename;
    originalname = file.originalname;
    doc_url = `/${namespace}/traindatas/${file.filename}`;
    const pinecone = new PineconeClient();
    await pinecone.init({
      environment: PINECONE_ENVIRONMENT,
      apiKey: PINECONE_API_KEY,
    });

    const pineconeIndex = pinecone.Index(PINECONE_INDEX_NAME);

    const loader = fileLoad(file.filename, doc_url);

    const rawDocs = await loader.load();

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 0,
    });

    const docs = await textSplitter.splitDocuments([
      new Document({
        pageContent: rawDocs[0].pageContent,
      }),
    ]);

    // console.log("start embeddings :::: ", namespace);
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: OPENAI_API_KEY,
    });

    await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex: pineconeIndex,
      namespace: namespace,
    });

    res.status(200).json({ doc_url: doc_url, label: file.originalname });
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.getReply = async (req, res, next) => {
  try {
    const namespace = req.body.namespace;
    const message = req.body.message;

    let results = null;

    if (!namespace || !message) {
      return res.status(404).json({ message: "Parameter Error" });
    }

    const pinecone = new PineconeClient();

    await pinecone.init({
      environment: PINECONE_ENVIRONMENT,
      apiKey: PINECONE_API_KEY,
    });

    const index = pinecone.Index(PINECONE_INDEX_NAME);

    /* create vectorstore*/
    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY }),
      {
        pineconeIndex: index,
        textKey: "text",
        namespace: namespace,
      }
    );

    const llm = new OpenAI({
      openAIApiKey: OPENAI_API_KEY,
      temperature: 0,
    });

    results = await vectorStore.similaritySearch(message, 5);

    const chain = loadQAChain(llm, { type: "stuff" });

    await index.delete1({
      deleteAll: true,
      namespace: "Linkdin",
    });

    const result = chain
      .call({
        input_documents: results,
        question: message,
      })
      .then(async (row) => {
        return res.status(200).json(row);
      });
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.getReplyQA = async (req, res, next) => {
  console.log(req.body);
  const prompt = req.body.message;
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `Which of the job title, salary, location, or duration represents ${prompt}? The answer can only be one of job title, salary, location, and duration.`,
    // prompt: `If ${prompt} means location, give me the exact location. only location name. `,
    temperature: 0.2,
  });

  const outputString = response.data.choices[0].text.trim();

  const ask = await openai.createCompletion({
    model: "text-davinci-003",
    // if ${outputString} means  job title, then write a question about where you would like to work in Indeed Career.
    prompt: `If ${outputString} means Location, give me ${prompt}'s the exact Location. only Location name.`,
    temperature: 0.2,
  });
  console.log(response.data.choices[0].text, ask.data.choices[0].text);

  res.status(200).json({
    label: response.data.choices[0].text.trim(),
    ask: ask.data.choices[0].text.trim(),
  });
};

exports.delBotById = (req, res, next) => {
  const bot_id = req.body.bot_id;
  const bot_name = req.body.bot_name;
  if (!bot_id || !bot_name)
    return res.status(404).json({ message: "Parameter Error" });
  Bot.delBotById(bot_id, (err, data) => {
    if (err) {
      res.status(500).send({
        status: "error",
        message: err.message,
      });
    } else {
      fs.rmdir(
        path.join(__dirname, PUBLIC_URL + bot_name),
        { recursive: true },
        () => {
          res.status(200).send({
            status: "success",
            data: {
              message: data.message,
            },
          });
        }
      );
    }
  });
};

exports.changeBotName = (req, res, next) => {
  const bot_id = req.body.bot_id;
  const new_name = req.body.new_name;
  Bot.changeBotName({ bot_id, new_name }, (err, data) => {
    if (err) {
      res.status(500).send({
        status: "error",
        message: err.message,
      });
    } else {
      res.status(200).send({
        status: "success",
        data: {
          message: "success",
        },
      });
    }
  });
};

exports.changeBotDescription = (req, res, next) => {
  const bot_id = req.body.bot_id;
  const new_description = req.body.new_description;
  Bot.changeBotDescription({ bot_id, new_description }, (err, data) => {
    if (err) {
      res.status(500).send({
        status: "error",
        message: err.message,
      });
    } else {
      res.status(200).send({
        status: "success",
        data: {
          message: "success",
        },
      });
    }
  });
};
exports.getDOCfolder = async (req, res, next) => {
  // Load the PDF filedoc_url
  const namespace = req.body.namespace;
  const sourceFilePath = `./src/public${req.body.message.doc_url}`;

  const newDirPath = `./src/public/${req.body.message.doc0}`;
  if (!fs.existsSync(newDirPath)) {
    fs.mkdirSync(newDirPath);
    const newDirPath1 = `./src/public/${req.body.message.doc0}/${req.body.message.doc1}`;
    if (!fs.existsSync(newDirPath1)) {
      fs.mkdirSync(newDirPath1);
    }
  }

  const destinationFilePath = `./src/public/${req.body.message.doc0}/${req.body.message.doc1}/${req.body.message.filename}`;

  // Read the file from the source directory
  fs.readFile(sourceFilePath, (err, data) => {
    if (err) throw err;

    // Write the file to the destination directory
    fs.writeFile(destinationFilePath, data, (err) => {
      if (err) throw err;
      console.log("File moved successfully!");
    });

    // Delete the file from the source directory
    fs.unlink(sourceFilePath, (err) => {
      if (err) throw err;
      console.log("Source file deleted successfully!");
    });
  });

  const pinecone = new PineconeClient();

  await pinecone.init({
    environment: PINECONE_ENVIRONMENT,
    apiKey: PINECONE_API_KEY,
  });

  const index = pinecone.Index(PINECONE_INDEX_NAME);

  // await index.delete1({
  //   deleteAll: true,
  //   namespace: namespace,
  // });

  Bot.createTrainData(
    { filename, originalname, doc_url, bot_id },
    async (err, data) => {
      if (err) {
        res.status(500).send({
          status: "error",
          message: err.message,
        });
      }
    }
  );
};

exports.changeBotImg = (req, res, next) => {
  const bot_name = req.body.bot_name;
  const file = req.file;
  if (!file) {
    const error = new Error("No File");
    error.httpStatusCode = 400;
    return next(error);
  }
  // Bot.changeBotImg(
  //   {
  //     bot_name,
  //     img_url: `/${bot_name}/${file.filename}`,
  //   },
  //   (err, data) => {
  //     if (err) {
  //       res.status(500).send({
  //         status: "error",
  //         message: err.message,
  //       });
  //     } else {
  res.status(200).send({
    status: "success",
    data: {
      img_url: `/${bot_name}/${file.filename}`,
    },
  });
  //     }
  //   }
  // );
};

exports.getTrainDataById = (req, res, next) => {
  Bot.getTrainDataById(req.body.trainDataId, (err, data) => {
    if (err) {
      res.status(500).send({
        status: "error",
        message: err.message,
      });
    } else {
      if (data != null) {
        res.status(200).send({
          status: "success",
          data: {
            data: data,
          },
        });
      } else {
        res.status(404).send({
          status: "not found",
          data: {
            message: "Nothing!",
          },
        });
      }
    }
  });
};

exports.delTrainDataById = (req, res, next) => {
  const delTrainDataId = req.body.delTrainDataId;
  const delTrainDataFilename = req.body.delTrainDataFilename;
  const namespace = req.body.bot_name;
  if (!delTrainDataId || !delTrainDataFilename || !namespace)
    return res.status(404).json({ message: "Parameter Error" });
  Bot.delTrainDataById(delTrainDataId, async (err, data) => {
    if (err) {
      res.status(500).send({
        status: "error",
        message: err.message,
      });
      return;
    }
    if (data) {
      const pinecone = new PineconeClient();
      await pinecone.init({
        environment: PINECONE_ENVIRONMENT,
        apiKey: PINECONE_API_KEY,
      });

      const pineconeIndex = pinecone.Index(PINECONE_INDEX_NAME);
      await pineconeIndex.delete1({
        deleteAll: true,
        namespace: namespace,
      });
      const delTrainDataUrl = `/${namespace}/traindatas/${delTrainDataFilename}`;
      fs.unlink(path.join(__dirname, PUBLIC_URL + delTrainDataUrl), (err) => {
        if (err) {
          throw err;
        } else {
          const trainDataDirUrl = `/${namespace}/traindatas/`;
          fs.readdir(
            path.join(__dirname, PUBLIC_URL + trainDataDirUrl),
            async function (err, filenames) {
              if (err) {
                onError(err);
                return;
              }
              for (let i = 0; i < filenames.length; i++) {
                const filename = filenames[i];
                const reTrainDataUrl = `/${namespace}/traindatas/${filename}`;
                const pinecone = new PineconeClient();
                await pinecone.init({
                  environment: PINECONE_ENVIRONMENT,
                  apiKey: PINECONE_API_KEY,
                });

                const pineconeIndex = pinecone.Index(PINECONE_INDEX_NAME);

                const loader = fileLoad(filename, reTrainDataUrl);

                const rawDocs = await loader.load();

                const textSplitter = new RecursiveCharacterTextSplitter({
                  chunkSize: 500,
                  chunkOverlap: 0,
                });

                const docs = await textSplitter.splitDocuments([
                  new Document({
                    pageContent: rawDocs[0].pageContent,
                  }),
                ]);

                // console.log("start embeddings :::: ", namespace);
                const embeddings = new OpenAIEmbeddings({
                  openAIApiKey: OPENAI_API_KEY,
                });

                await PineconeStore.fromDocuments(docs, embeddings, {
                  pineconeIndex: pineconeIndex,
                  namespace: namespace,
                });
              }

              res.status(200).send({
                status: "success",
                data: {
                  message: "Delete a training data successfully!",
                },
              });
            }
          );
        }
      });

      return;
    }
  });
};

exports.clearTrainDataByBotId = (req, res, next) => {
  const bot_id = req.body.bot_id;
  const namespace = req.body.bot_name;
  if (!bot_id || !namespace)
    return res.status(404).json({ message: "Parameter Error" });
  Bot.clearTrainDataByBotId(bot_id, async (err, data) => {
    if (err) {
      res.status(500).send({
        status: "error",
        message: err.message,
      });
      return;
    }
    if (data) {
      const pinecone = new PineconeClient();
      await pinecone.init({
        environment: PINECONE_ENVIRONMENT,
        apiKey: PINECONE_API_KEY,
      });

      const pineconeIndex = pinecone.Index(PINECONE_INDEX_NAME);
      await pineconeIndex.delete1({
        deleteAll: true,
        namespace: namespace,
      });

      fs.rmdir(
        path.join(__dirname, PUBLIC_URL + namespace + "/traindatas"),
        { recursive: true },
        () => {
          res.status(200).send({
            status: "success",
            data: {
              bots: [],
            },
          });
        }
      );
      return;
    }
  });
};

exports.validUrl = async (req, res, next) => {
  const url = req.body.data;
  let flag = true;
  try {
    const response = await axios.get(url, { timeout: 1000 });
    if (response.status != 200) {
      flag = false;
      throw new Error("Invalid response status");
    }
  } catch (error) {
    console.log(error);
  }
  res.status(200).send({ flag });
};

exports.siteEmbed = async (req, res) => {
  try {
    const link = req.body.data;
    /////////////////////////////////////////////////////////////////
    const bot_id = req.body.bot_id;
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:55.0) Gecko/20100101 Firefox/55.0",
    };
    const response = await axios.get(link, { headers });
    const $ = cheerio.load(response.data);

    const tags = $("h1, h2, h3, h4, h5, h6, p, span");
    let all_text = "";
    tags.each((i, tag) => {
      all_text += $(tag).text() + "\n";
    });
    const namespace = req.body.namespace;
    const parsedUrl = url.parse(link);
    const hostname = parsedUrl.hostname.replace("www.", "");

    const domainName = hostname.split(".")[0] + ".txt";
    console.log(domainName, "!!!!!!!!!!!!!!!!!!!!");
    const doc_url = `/${namespace}/traindatas/${domainName}`;
    fs.writeFileSync(`src/public/${doc_url}`, all_text, "utf-8");

    /////////////////////////////////////////////////////////////////
    Bot.createTrainData(
      {
        filename: domainName,
        originalname: domainName,
        doc_url: doc_url,
        bot_id: bot_id,
      },
      async (err, data) => {
        if (err) {
          res.status(500).send({
            status: "error",
            message: err.message,
          });
        } else {
          if (data != null) {
            const pinecone = new PineconeClient();
            await pinecone.init({
              environment: PINECONE_ENVIRONMENT,
              apiKey: PINECONE_API_KEY,
            });

            const pineconeIndex = pinecone.Index(PINECONE_INDEX_NAME);

            const loader = fileLoad(`${domainName}.txt`, doc_url);

            const rawDocs = await loader.load();

            const textSplitter = new RecursiveCharacterTextSplitter({
              chunkSize: 500,
              chunkOverlap: 0,
            });

            const docs = await textSplitter.splitDocuments([
              new Document({
                pageContent: rawDocs[0].pageContent,
              }),
            ]);

            // console.log("start embeddings :::: ", namespace);
            const embeddings = new OpenAIEmbeddings({
              openAIApiKey: OPENAI_API_KEY,
            });

            await PineconeStore.fromDocuments(docs, embeddings, {
              pineconeIndex: pineconeIndex,
              namespace: namespace,
            });

            // console.log("end embeddings :::: ", namespace);

            res.status(200).json({ key: data.id, label: domainName });
          }
        }
      }
    );
  } catch (error) {
    // console.log("error::::   ", error);
    res.status(500).send(error);
  }
};

exports.jobsearch = async (req, res) => {
  const profile_id = req.body.url;
  console.log(profile_id);
  // const PROXYCURL_API_KEY = "obxO6_VJUoK6KhWcm9MSXQ";
  const PROXYCURL_API_KEY = "7eOpUC6-f4FbZeGGfdjzXw";
  const api_endpoint = "https://nubela.co/proxycurl/api/v2/linkedin";
  const header_dic = { Authorization: "Bearer " + PROXYCURL_API_KEY };
  const params = {
    url: profile_id,
    // fallback_to_cache: "on-error",
    // use_cache: "if-present",
    skills: "include",
    // inferred_salary: "include",
    // personal_email: "include",
    // personal_contact_number: "include",
    // twitter_profile_id: "include",
    // facebook_profile_id: "include",
    // github_profile_id: "include",
    // extra: "include",
  };
  const response = await axios.get(api_endpoint, {
    params: params,
    headers: header_dic,
  });
  console.log(response.data);
  return res.status(200).send(response.data);
};

exports.jobsearchindeed = async (req, res) => {
  const data = req.body;
  const options = {
    method: "GET",
    url: "https://jsearch.p.rapidapi.com/search",
    params: {
      query: data.query,
      page: "1",
      num_pages: "5",
    },
    // e71fae5776msha7eea3e49a2beedp11f4d3jsn4245aaa0664a
    // 870f9eb191msh9222cb3c5081760p142902jsnd8bf864bf6f2
    // 832812154msh95f120cc5060c1p160872sn44c7
    headers: {
      "X-RapidAPI-Key": "e71fae5776msha7eea3e49a2beedp11f4d3jsn4245aaa0664a",
      "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    },
  };
  try {
    const response = await axios.request(options);
    return res.status(200).send(response.data.data);
  } catch (error) {
    console.error(error);
  }
};
