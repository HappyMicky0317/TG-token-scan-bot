const { TelegramClient, client } = require("telegram");
const { StringSession } = require("telegram/sessions");
const {
  configKeys,
  BOT_TOKEN,
  BOT_PROVIDER_PIRB,
  BOT_PROVIDER_ALPHA,
  BOT_PROVIDER_OttoSim,
  BOT_PROVIDER_TTF,
} = require("./config");

const {
  getTokenAgePools,
  getTokenBasic,
  getTokenMainInfo,
  getTokenBalanceHolders,
  getGas,
  getPNL,
  getTeamInfo,
  getTopList,
  findAndRemoveBotCommand,
  wait,
  isValidEthAddress,
  getSecurity,
  getLockState,
  getTaxInfo,
  getAge,
  getMaxLimit,
  getContractBalance,
  getPoolStat,
  getDeployer,
  getTokenSocial,
  getCurrentPrice,
  getCurrentVolume,
  getIntroduction,
  getChartInfo,
  getMarketingFee,
  getTokenName,
  getTokenAddress,
  getTokenChain,
  getTokenContarct,
  getTokenSupply,
  handleTaxCmd,
  processCmtCommand,
  processKolCommand,
  debounce,
  sendAnalyzedMessage,
  checkMessages,
  checkIfGenerating,
  GetAnswer,
  sendHoldersMessage,
} = require("./utils");

const { NewMessage } = require("telegram/events");
const { EditedMessage } = require("telegram/events/EditedMessage");
const { DeletedMessage } = require("telegram/events/DeletedMessage");
const { Telegraf, Input } = require("telegraf");
const { toHTML } = require("@telegraf/entity");
const path = require("path");
const { inlineKeyboard } = require("telegraf/markup");
const { messageParse, message } = require("telegram/client");
const { url } = require("inspector");

const {
  OttoSimBotChatId,
  keyboardsAnalyze,
  NoDetect,
  NonSupport,
} = require("./constant");
const { text } = require("express");
// const { parse } = require("./parse");

const fs = require("fs").promises;

const functionDebounced = (callback) => {
  callback();
};
const debounceFn = debounce(functionDebounced, 3000);

const projectDirectory = "download";

var clientList = [];

var isWaitingResponse = {};

var actions = [];

var currentAd = {
  index: 0,
  proIndex: 0,
};
const customAds = "";

const availableCommands = [
  // "start",
  // "analyze",
  // "c",
  // "ta",
  // "ma",
  // "smi",
  // "bol",
  // "ema",
  // "h",
  // "e",
  // "team",
  // "tax",
  // "pnl",
  // // "tr",
  // "gas",
  // "fear",
  // "market",
  // "whale",
  // "jeet",
  // "cross",
  // "x",
  // "airdrop",
  // "cmt",
  // "hmp",
  // "kol",
  // "htag",
  // "ctag",
  // "t",
  "an",
  "scan",
  "s",
  "info",
  "i",
  "holders",
  "h",
  "bubbles",
  "b",
  "airdrops",
  "a",
  "early",
  "e",
  "chart",
  "c",
  "1m",
  "15m",
  "30m",
  "1h",
  "4h",
  "6h",
  "1d",
  "1w",
  "tax",
  "t",
  "portfolio",
  "pf",
];

const getAndCheckUserConfig = async (chatId, userName, firstName) => {
  try {
    const user = await User.findOne({ chatID: chatId });
    if (user == undefined) {
      const newUser = new User({
        chatID: chatId,
        userName: userName,
        firstName: firstName,
      });
      await newUser.save();
    }
    return;
  } catch (err) {
    console.log("1\n", err);
    return;
  }
};

const isAd = (message) => {
  return (
    message.includes("ᴘᴀɪᴅ ᴘʀᴏᴍᴏᴛɪᴏɴ") ||
    message.includes("PAID PROMOTION") ||
    message.includes("Stop flipping through") ||
    message.includes("PRO TIP") ||
    message.includes("TIP") ||
    message.includes("You have to join the official") ||
    message.includes("You still have to join these:") ||
    message.includes("You can now use Maestro")
  );
};

//#region ParseHtmlWithEntities
const parseHtmlWithEntities = (text, entities) => {
  try {
    if (text.includes("You are already executing a command")) {
      return "Please wait for a while.";
    }

    if (entities == undefined || entities == null || entities.length == 0)
      return text;

    let updatedText = "";
    let normalText = [];
    let entityText = [];

    let lastStart = 0;
    let start = 0;
    let end = 0;

    for (let entity of entities) {
      start = entity.offset;
      end = start + entity.length;
      if (start > lastStart) {
        normalText.push({
          offset: lastStart,
          length: start - lastStart,
          text: text.substring(lastStart, start),
        });
      }
      lastStart = end;

      let element = text.substring(start, end);

      let indexOfEntityText = entityText.findIndex((item) => {
        if (
          item.offset <= entity.offset &&
          item.offset + item.length >= entity.offset + entity.length
        ) {
          return true;
        }
      });
      if (indexOfEntityText == -1) {
        entityText.push({
          offset: entity.offset,
          length: entity.length,
          text: element,
          className: entity.className,
          url: entity.url,
          entities: [],
        });
      } else {
        let ent = entityText[indexOfEntityText];
        ent.entities.push({
          offset: entity.offset - ent.offset,
          length: entity.length,
          className: entity.className,
          url: entity.url,
        });
        entityText[indexOfEntityText] = ent;
      }
    }
    if (lastStart < text.length) {
      normalText.push({
        offset: lastStart,
        length: text.length - lastStart,
        text: text.substring(lastStart, text.length),
      });
    }

    let normalLen = 0;
    let entityLen = 0;

    while (true) {
      if (normalLen >= normalText.length || entityLen >= entityText.length) {
        break;
      }
      if (normalText[normalLen].offset < entityText[entityLen].offset) {
        updatedText += normalText[normalLen].text;
        normalLen++;
      } else {
        let className = entityText[entityLen].className;
        let res = entityText[entityLen].text;
        if (entityText[entityLen].entities.length > 0)
          res = parseHtmlWithEntities(res, entityText[entityLen].entities);
        switch (className) {
          case "MessageEntityBold":
            res = `<b>${res}</b>`;
            break;
          case "MessageEntityItalic":
            res = `<i>${res}</i>`;
            break;
          case "MessageEntityUnderline":
            res = `<u>${res}</u>`;
            break;
          case "MessageEntityCode":
            res = `<code>${res}</code>`;
            break;
          case "MessageEntityPre":
            res = `<pre>${res}</pre>`;
            break;
          case "MessageEntityTextUrl":
            res = `<a href="${entityText[entityLen].url}">${res}</a>`;
            break;
          // case "MessageEntityMentionName":
          //   res = `<a href='tg://user?id=${res}'>${res}</a>`;
          //   break;
          // case "MessageEntityHashtag":
          //   res = `<a href='tg://hashtag?tag=${res}'>${res}</a>`;
          //   break;
        }
        updatedText += res;
        entityLen++;
      }
    }

    for (let i = normalLen; i < normalText.length; i++) {
      updatedText += normalText[i].text;
    }
    for (let i = entityLen; i < entityText.length; i++) {
      let className = entityText[i].className;
      let res = entityText[i].text;
      if (entityText[i].entities.length > 0)
        res = parseHtmlWithEntities(res, entityText[i].entities);
      switch (className) {
        case "MessageEntityBold":
          res = `<b>${res}</b>`;
          break;
        case "MessageEntityItalic":
          res = `<i>${res}</i>`;
          break;
        case "MessageEntityUnderline":
          res = `<u>${res}</u>`;
          break;
        case "MessageEntityCode":
          res = `<code>${res}</code>`;
          break;
        case "MessageEntityPre":
          res = `<pre>${res}</pre>`;
          break;
        case "MessageEntityTextUrl":
          res = `<a href="${entityText[i].url}">${res}</a>`;
          break;
        // case "MessageEntityMentionName":
        //   res = `<a href='tg://user?id=${res}'>${res}</a>`;
        //   break;
        // case "MessageEntityHashtag":
        //   res = `<a href='tg://hashtag?tag=${res}'>${res}</a>`;
        //   break;
      }
      updatedText += res;
    }
    return updatedText;
  } catch (err) {
    console.log(err);
  }
};

const parseHtmlWithEntities1 = (text, entities) => {
  try {
    if (text.includes("You are already executing a command")) {
      return "Please wait for a while.";
    }

    if (entities == undefined || entities == null || entities.length == 0)
      return text;

    let updatedText = "";
    let normalText = [];
    let entityText = [];

    let lastStart = 0;
    let start = 0;
    let end = 0;

    for (let entity of entities) {
      start = entity.offset;
      end = start + entity.length;
      if (start > lastStart) {
        normalText.push({
          offset: lastStart,
          length: start - lastStart,
          text: text.substring(lastStart, start),
        });
      }
      lastStart = end;

      let element = text.substring(start, end);

      let indexOfEntityText = entityText.findIndex((item) => {
        if (
          item.offset <= entity.offset &&
          item.offset + item.length >= entity.offset + entity.length
        ) {
          return true;
        }
      });
      if (indexOfEntityText == -1) {
        entityText.push({
          offset: entity.offset,
          length: entity.length,
          text: element,
          className: entity.className,
          url: entity.url,
          entities: [],
        });
      } else {
        let ent = entityText[indexOfEntityText];
        ent.entities.push({
          offset: entity.offset - ent.offset,
          length: entity.length,
          className: entity.className,
          url: entity.url,
        });
        entityText[indexOfEntityText] = ent;
      }
    }
    if (lastStart < text.length) {
      normalText.push({
        offset: lastStart,
        length: text.length - lastStart,
        text: text.substring(lastStart, text.length),
      });
    }

    let normalLen = 0;
    let entityLen = 0;

    while (true) {
      if (normalLen >= normalText.length || entityLen >= entityText.length) {
        break;
      }
      if (normalText[normalLen].offset < entityText[entityLen].offset) {
        updatedText += normalText[normalLen].text;
        normalLen++;
      } else {
        let className = entityText[entityLen].className;
        let res = entityText[entityLen].text;
        if (entityText[entityLen].entities.length > 0)
          res = parseHtmlWithEntities(res, entityText[entityLen].entities);
        switch (className) {
          case "MessageEntityCode":
            res = `<code>${res}</code>`;
            break;

          // case "MessageEntityMentionName":
          //   res = `<a href='tg://user?id=${res}'>${res}</a>`;
          //   break;
          // case "MessageEntityHashtag":
          //   res = `<a href='tg://hashtag?tag=${res}'>${res}</a>`;
          //   break;
        }
        updatedText += res;
        entityLen++;
      }
    }

    for (let i = normalLen; i < normalText.length; i++) {
      updatedText += normalText[i].text;
    }
    for (let i = entityLen; i < entityText.length; i++) {
      let className = entityText[i].className;
      let res = entityText[i].text;
      if (entityText[i].entities.length > 0)
        res = parseHtmlWithEntities(res, entityText[i].entities);
      switch (className) {
        case "MessageEntityCode":
          res = `<code>${res}</code>`;
          break;

        // case "MessageEntityMentionName":
        //   res = `<a href='tg://user?id=${res}'>${res}</a>`;
        //   break;
        // case "MessageEntityHashtag":
        //   res = `<a href='tg://hashtag?tag=${res}'>${res}</a>`;
        //   break;
      }
      updatedText += res;
    }
    return updatedText;
  } catch (err) {
    console.log(err);
  }
};

//#region ProcessMSG before show
const removeMsg = (msg) => {
  try {
    msg = msg.replaceAll("🦜 PIRB", "Build View");
    msg = msg.replaceAll("/r/@PIRB", "/lp");
    msg = msg.replaceAll("🦜", "");
    msg = msg.replaceAll("@PIRBViewBot", "@BuildViewBot");
    msg = msg.replaceAll("@PIRBViewPROBot", "@BuildViewBot");
    msg = msg.replaceAll("PIRBView", "BuildViewBot");
    // msg = msg.replace(/<i>Ads<\/i>: .*/, `${customAds}`);
    // msg = msg.replace(/<code>Ad:<\/code>: .*/, `${customAds}`);
    // msg = msg.replace(/Ad: .*/, `${customAds}`);
    // msg = msg.replace(/An in-depth explanation .*/, ``);

    // hmap, hmp, holder's map
    msg = msg.replace(
      "The map above shows the top 70 wallets and their trading behavior for the scanned token.",
      "The map above displays the top 70 wallets and their activity for the scanned token."
    );

    // remove https://twitter.com/Panthar440/status/None //status/None
    msg = msg.replaceAll("/status/None", "");

    msg = msg.replace("Top 45 holders", "Top 15 holders");

    msg = msg.replace(
      "is only available for ETH,BSC and Base tokens.",
      "is only available for ETH and BSC tokens."
    );

    // For only whale map, we have to add </b> tag at the last
    msg = msg.replace(
      "🐳 The map above shows the top 70 wallets and their wallet sizes in ETH and stablecoins.",
      "🐳 The map above shows the top 70 wallets and their wallet sizes in ETH and stablecoins.</b>"
    );

    // For the decoration
    // msg = msg.replaceAll("🟢", "🔼");
    // msg = msg.replaceAll("🔴", "🔽");
    // msg = msg.replaceAll("🟢", "💵");

    msg = msg.replaceAll("⛓", "🔗");
    msg = msg.replaceAll("💧", "💦");
    msg = msg.replaceAll("🏷️", "💲");
    msg = msg.replaceAll("🎚", "📈");
    msg = msg.replace("🏃", "🚀");
    msg = msg.replace("🚶", "🚗");
    msg = msg.replaceAll("➡️", "✅");
    msg = msg.replaceAll("🐳", "🐋");
    // msg = msg.replaceAll("🦈", "🐋");
    // msg = msg.replaceAll("🐟", "🐋");
    msg = msg.replaceAll("🦐", "🍤");
    let lines = msg.split("\n");

    // loading message
    msg = msg.replace(
      "this can take up to 1-2 Minutes...",
      "this can take up to 2 Minutes..."
    );

    let filteredLines = lines.filter(
      (line) =>
        !(
          line.includes("📈 Charts:") ||
          line.includes("Do you want to see more wallets?") ||
          line.includes("<b>Subscribe to") ||
          line.includes("Do you want to see more trades?") ||
          line.includes("@BuildViewBot") ||
          line.includes("An in-depth explanation") ||
          line.includes("Ads") ||
          line.includes("Ad:") ||
          line == "\n"
        )
    );

    let outputText = filteredLines.join("\n");
    return outputText;
  } catch (err) {
    console.log(err);
  }
};

const processMsg = (msg) => {
  try {
    msg = msg.replace("💵 Tax report by @PIRBViewPROBot:", "💵 Tax report:");

    msg = msg.replace(/An in-depth explanation can be .*/, "");
    msg = msg.replace("❇️ Do you want to see more trades?", "");
    msg = msg.replace("❇️ Do you want to see more wallets?", "");
    msg = msg.replace(/➡️ Subscribe to .*/, "");
    msg = msg.replace("@PIRBViewBot 🦜", "@BuildViewBot");
    msg = msg.replace("Top 45 holders", "Top 15 holders");

    // result when right token for the /team command
    msg = msg.replace(
      "is only available for ETH,BSC and Base tokens.",
      "is only available for ETH and BSC tokens."
    );

    msg = msg.replaceAll("🌱", "👁‍🗨");
    msg = msg.replace("🦜 PIRBView", "Build View");
    msg = msg.replace("PIRBView", "Build View");
    msg = msg.replace(/Ads: .*/, `${customAds}`);
    msg = msg.replace(/__Ads__: .*/, `${customAds}`);
    msg = msg.replace("🦜 PIRB", "Build View");
    msg = msg.replaceAll("🟢", "🔼");
    msg = msg.replaceAll("🔴", "🔽");
    msg = msg.replaceAll("🟢", "💵");
    msg = msg.replaceAll("⛓", "🔗");
    msg = msg.replaceAll("💧", "💦");
    msg = msg.replaceAll("🏷", "💲");
    msg = msg.replaceAll("🎚", "📈");
    msg = msg.replace(/📈 Charts: .*/, "");
    msg = msg.replace("🏃 Rapid", "🚀 Rapid");
    msg = msg.replace("🚶 Standard", "🚗 Standard");
    msg = msg.replaceAll("➡️ Transfer", "✅ Transfer");

    return msg;
    //🟢 1h: 1.3% 🔴 24h: -1.9%
  } catch (err) {
    console.log("err");
  }
};

const availableChannels = [
  6362041475, //"PirbViewBot",
  //"Xalpha_bot",
  6233195423, //"OttoSimBot",
  6380038829, // XALPHA
  6113783210, // ttf
];

const bot = new Telegraf(BOT_TOKEN);

//#region  download and return media
const getMedia = async (client, message) => {
  try {
    const buffer = await client.downloadMedia(message.media, {});
    const filePath = path.join(
      __dirname,
      projectDirectory,
      `caches${client.ctx.chat.id}.jpg`
    );
    await fs.writeFile(filePath, buffer);
    const res = Input.fromLocalFile(filePath);

    return res;
  } catch (err) {
    console.log(err);
  }
};

//#region get original message id

const getMessageIdForUser = ({
  clientId = null,
  messageId = null,
  chatId = null,
  chatMessageId = null,
}) => {
  return new Promise((res, rej) => {
    let cnt = 0;
    const interval = setInterval(() => {
      try {
        for (let action of actions) {
          if (clientId && clientId != action.clientId) continue;
          if (messageId && messageId != action.messageId) continue;
          if (chatId && chatId != action.chatId) continue;
          if (chatMessageId && chatMessageId != action.chatMessageId) continue;
          return res(action);
        }
      } catch (err) {}
      cnt++;
      if (cnt >= 10) {
        clearInterval(interval);
        return res(null);
      }
    }, 100);
  });
};

//#region get current client status
const getClientStatus = (id) => {
  for (let client of clientList) {
    if (client.id == id) {
      return client;
    }
  }
  return null;
};

//
//#region init telegram clients
const connectClient = async (key) => {
  try {
    let client = new TelegramClient(
      new StringSession(key.string_session),
      Number(key.api_id),
      key.hash,
      {
        connectionRetries: 5,
      }
    );
    await client.connect();
    const pirbId = await client.getEntity(BOT_PROVIDER_PIRB);
    const ottoId = await client.getEntity(BOT_PROVIDER_OttoSim);
    const xId = await client.getEntity(BOT_PROVIDER_ALPHA);
    const ttfId = await client.getEntity(BOT_PROVIDER_TTF);

    client.ctx = null;

    // If client is live yet, log this msg
    client.addEventHandler(async (event) => {
      const message = event.message;

      const clientData = getClientStatus(key.api_id);
      if (
        !event.message.isReply &&
        checkIfGenerating(message.message) &&
        (event.message.isReply || event.message.text !== "") &&
        clientData.lastCommand !== "/gas" &&
        clientData.lastCommand !== "/th"
      )
        return;

      if (!checkIfGenerating(message.message)) {
        bot.telegram.sendChatAction(clientData.bot.ctx.chat.id, "typing");
      }
      if (isAd(message.text)) return;
      if (availableChannels.indexOf(Number(message.senderId)) == -1) return;
      if (!clientData.lastCommand) return;

      const command = clientData?.lastCommand?.split(" ")[0].substring(1);
      const address = clientData?.lastCommand?.split(" ")[1] || "";

      let processedReply = parseHtmlWithEntities(
        message.message,
        message.entities
      );
      console.log("command-----------------", command);
      if (command == "th") {
        processedReply = parseHtmlWithEntities1(
          message.message,
          message.entities
        );
        processedReply = processedReply.replace(
          /The Community Map .*/,
          "The map above shows how influencers are categorized in tweets mentioning a particular token."
        );
        processedReply = processedReply.replaceAll("XALPHA", "Build View");
        processedReply = processedReply
          .replaceAll("| Summarize", "")
          .replaceAll("🐦", " 🔊"); // | Summarize
        // For the f command we have to convert <500 to < 500
        processedReply = processedReply
          .replaceAll("<500", "0 to 500")
          .replace("🥇", "1️⃣")
          .replace("🥈", "2️⃣")
          .replace("🥉", "3️⃣");
      }

      if (command == "ts") {
        processedReply = parseHtmlWithEntities(
          message.message,
          message.entities
        );
        // processedReply = processedReply.replace(
        //   /<code>Ad:<\/code>.*$/,
        //   `${customAds}`
        // ); //XALPHA
        processedReply = processedReply
          .replaceAll("| Summarize", "")
          .replaceAll("🐦", " 🔊"); // | Summarize
        // For the f command we have to convert <500 to < 500
        processedReply = processedReply
          .replaceAll("<500", "0 to 500")
          .replaceAll("🥇", "1️⃣")
          .replaceAll("🥈", "2️⃣")
          .replaceAll("🥉", "3️⃣");
        processedReply = processedReply.replaceAll(
          `<a href="https://dexscreener.com/ethereum/0x369733153e6e08d38f2bc72ae2432e855cfbe221">XALPHA</a>`,
          `<a href="https://dexscreener.com/ethereum/0x73454acfddb7a36a3cd8eb171fbea86c6a55e550">BUILD</a>`
        );
      }

      if (command == "x") {
        processedReply = parseHtmlWithEntities1(
          message.message,
          message.entities
        );
        processedReply = processedReply.replace(
          /The Community Map .*/,
          "The map above shows how influencers are categorized in tweets mentioning a particular token."
        );
        processedReply = processedReply.replaceAll("XALPHA", "Build View");
        processedReply = processedReply
          .replaceAll("| Summarize", "")
          .replaceAll("🐦", " 🔊"); // | Summarize
        // For the f command we have to convert <500 to < 500
        processedReply = processedReply
          .replaceAll("<500", "0 to 500")
          .replace("🥇", "1️⃣")
          .replace("🥈", "2️⃣")
          .replace("🥉", "3️⃣");
      }

      if (command == "f") {
        processedReply = processedReply.replace(
          /The Community Map .*/,
          "The map above shows how influencers are categorized in tweets mentioning a particular token."
        );
        // processedReply = processedReply.replace(
        //   /<code>Ad:<\/code><a href="[^"]+">[^<]+<\/a>/,
        //   `${customAds}`
        // ); //XALPHA
        processedReply = processedReply.replaceAll("XALPHA", "Build View");
        processedReply = processedReply
          .replaceAll("| Summarize", "")
          .replaceAll("🐦", " 🔊"); // | Summarize
        // For the f command we have to convert <500 to < 500
        processedReply = processedReply
          .replaceAll("<500", "0 to 500")
          .replace("🥇", "1️⃣")
          .replace("🥈", "2️⃣")
          .replace("🥉", "3️⃣");
        if (message?.entities?.length > 1) {
          processedReply = processCmtCommand(message.entities, processedReply);
        }
      }

      if (command == "kol") {
        // processedReply = processedReply.replace(
        //   /The Community Map .*/,
        //   "The map above shows how influencers are categorized in tweets mentioning a particular token."
        // );
        // processedReply = processedReply.replace(
        //   /<code>Ad:<\/code><a href="[^"]+">[^<]+<\/a>/,
        //   `${customAds}`
        // ); //XALPHA
        processedReply = processedReply.replaceAll("XALPHA", "Build View");
        processedReply = processedReply
          .replaceAll("| Summarize", "")
          .replaceAll("🐦", " 🔊"); // | Summarize
        // For the f command we have to convert <500 to < 500
        processedReply = processedReply
          .replaceAll("<500", "0 to 500")
          .replace("🥇", "1️⃣")
          .replace("🥈", "2️⃣")
          .replace("🥉", "3️⃣");

        if (message?.entities?.length > 1) {
          processedReply = processKolCommand(message.entities, processedReply);
        }
      }

      if (command == "t") {
        processedReply = parseHtmlWithEntities1(
          message.message,
          message.entities
        );
        // processedReply = processedReply.replace(
        //   /<code>Ad:<\/code>.*$/,
        //   `${customAds}`
        // ); //XALPHA
        // processedReply = processedReply.replaceAll("XALPHA", "Build d");
        processedReply = processedReply
          .replaceAll("| Summarize", "")
          .replaceAll("🐦", " 🔊"); // | Summarize
        // For the f command we have to convert <500 to < 500
        processedReply = processedReply
          .replaceAll("<500", "0 to 500")
          .replace("🥇 ", "1️⃣ $")
          .replace("🥈 ", "2️⃣ $")
          .replace("🥉 ", "3️⃣ $")
          .replace("4️⃣ ", "4️⃣ $")
          .replace("5️⃣ ", "5️⃣ $")
          .replace("6️⃣ ", "6️⃣ $")
          .replace("7️⃣ ", "7️⃣ $")
          .replace("8️⃣ ", "8️⃣ $")
          .replace("9️⃣ ", "9️⃣ $")
          .replace("🔟 ", "🔟 $")
          .replace(
            "Enter the name of the trend you're interested in analyzing.",
            "Enter the name of hashtag"
          )
          .replace(
            "Sorry, No data found for this hashtag",
            "There is No Data for this hashtag"
          );
      }

      // Bird Part
      if (command == "e") {
        processedReply = processedReply.replaceAll("🌱 =", "👀 👉");
        processedReply = processedReply.replace(
          "Emoji positions of fresh wallets which sold",
          "Positions of emojis for fresh wallets that were sold"
        );
        processedReply = processedReply.replace(
          /The graph above shows .*/,
          "The map displays the initial 70 purchasers of the token along with their current status."
        );
      }

      if (command == "j") {
        processedReply = processedReply.replaceAll("👶🏻", "👶🏽"); //👶🤱👼🐣🐥🐤🍼 😄😎
        processedReply = processedReply.replaceAll("👳🏾", "🤬"); // 😡😡🤬🤑
        processedReply = processedReply.replaceAll("😎", "😃");
        processedReply = processedReply.replace(
          /The JeetMap above illustrates .*/,
          "The Map above showcases the typical trading behavior of the top 70 holders of the token."
        );
      }

      if (command == "whale") {
        let index = processedReply.indexOf(
          "🐳 The map above shows the top 70 wallets and their wallet sizes in ETH and stablecoins."
        );
        if (index >= 0) {
          processedReply = processedReply.slice(0, index);
          processedReply += "</b>";
        }
      }

      if (command == "o") {
        processedReply = processedReply.replaceAll("🪙", "🔰"); //👶🤱👼🐣🐥🐤🍼 😄😎 🤼‍♂️🤼‍♀️👯‍♂️👯‍♀️💑💑👩‍❤️‍👩🔰⚖
        processedReply = processedReply.replace(
          /The graph above shows .*/,
          "The map shows top holders who possess both of the tokens."
        );
        processedReply = processedReply.replaceAll(
          "OverlapMap",
          "Cross-Token Synergy Map"
        );
        if (processedReply.includes("No overlap in holders found.")) {
          processedReply = "There are no top holders for both of the tokens";
        }
      }

      processedReply = removeMsg(processedReply);

      // Add ad here
      if (
        message.message.toLowerCase().indexOf("scanning token...") == -1 &&
        message.message.toLowerCase().indexOf("seconds...") == -1 &&
        message.message.toLowerCase().indexOf("generating message...") == -1 &&
        message.message
          .toLowerCase()
          .indexOf("pirb is generating the whalemap now") == -1 &&
        message.message.toLowerCase().indexOf("pirb is generating the") == -1 &&
        command != "market" &&
        command != "fear"
      ) {
        // processedReply = await parse(processedReply, command, address);
        if (processedReply === "No results found") {
          await bot.telegram.sendMessage(client.ctx.chat.id, processedReply);
          clientData.lastCommand = null;
          clientData.isAvailable = true;
          clientData.lastTime = Date.now();
          isWaitingResponse[client.ctx.chat.id] = {
            status: false,
            lastTIme: Date.now(),
          };
          return;
        }
      }

      // Sandokan's work
      console.log("processedReply---------------------", processedReply);
      let lines = processedReply.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("⚡")) {
          lines.splice(i, 1);
          break;
        }
      }

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("Deployer</a>:")) {
          lines.splice(i + 1, lines.length - i);
          break;
        }
      }
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("Chart for")) {
          lines.splice(i, 1);
          break;
        }
      }
      if (processedReply.includes("SOL") && processedReply.includes("solana")) {
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes("<b>Mint</b>:")) {
            lines.splice(i + 1, 1);
            break;
          }
        }
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes("Deployer</a>")) {
            lines.splice(i + 1, lines.length - i);
            break;
          }
        }

        // split marketcap and liquidity
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes("🌿")) {
            var parts = lines[i].split(" | ");
            lines.splice(i, 1);
            parts[1] = parts[1].replace("Liq", "Liquidity");
            parts[1] = "🥃 " + parts[1];
            lines.splice(i, 0, parts[1]);
            lines.splice(i, 0, parts[0]);
          }
        }
      } else if (processedReply.includes("Polygon ")) {
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes("Owner</a>:")) {
            lines.splice(i + 1, lines.length - i);
            break;
          }
        }
      } else if (processedReply.includes("Arbitrum")) {
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes("L2Gateway</a>:")) {
            lines.splice(i + 1, lines.length - i);
            break;
          }
        }
      } else if (processedReply.includes("Optimism")) {
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes("Sinkmanager</a>:")) {
            lines.splice(i + 1, lines.length - i);
            break;
          }
        }
      } else {
        if (command == "s" || command == "an" || command == "scan") {
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes("<b>Chain</b>:")) {
              lines.splice(i + 1, 1);
              break;
            }
          }
          // edit name and honeyport
          var temp1 = lines[0];
          var parts1 = temp1.split(" | ");
          parts1[0] = parts1[0].replace("📌 ", "");
          var temp_line1 = "📖 <b>Name:</b> " + parts1[0];
          var temp_line2 = "🍯 <b>HoneyPot:</b> " + parts1[1];
          lines.splice(0, 1);
          lines.splice(0, 0, temp_line2);
          lines.splice(0, 0, temp_line1);

          // remove "FUNCTIONS: > _feeFreeTransfer excludeAccount" line
          var tempIndex1 = 0;
          var tempIndex2 = 0;
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes("⚠️")) {
              tempIndex1 = i;
            }
            if (lines[i].includes("👨‍💻")) {
              tempIndex2 = i;
            }
          }
          lines.splice(tempIndex1, tempIndex2 - tempIndex1);
        }
      }

      // remove influencers
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("👨‍👨‍👧‍👦")) {
          lines.splice(i, 1);
          break;
        }
      }

      // rename TS and splite with burned
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("<b>TS:") && lines[i].includes("Burned")) {
          var parts = lines[i].split(" | ");
          parts[0] = parts[0].replace("TS", "Total Supply");
          parts[0] = parts[0].replace("📊", "🛒");
          parts[1] = "🔥 " + parts[1];
          lines.splice(i, 1);
          lines.splice(i, 0, parts[1]);
          lines.splice(i, 0, parts[0]);
        }
      }

      // split marketcap and liquidity
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("💰")) {
          var parts = lines[i].split(" | ");
          lines.splice(i, 1);
          parts[0] = parts[0].replace("MC", "Market Cap");
          parts[1] = parts[1].replace("Liq", "Liquidity");
          parts[1] = "🥃 " + parts[1];
          lines.splice(i, 0, parts[1]);
          lines.splice(i, 0, parts[0]);
        }
      }
      // remove photon and avi links
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("📊") && lines[i].includes("Dex")) {
          var parts = lines[i].split(" | ");
          for (let j = 0; j < parts.length; j++) {
            if (parts[j].includes("Photon")) {
              parts.splice(j, 1);
            }
            if (parts[j].includes("Ave.ai")) {
              parts.splice(j, 1);
            }
          }
          var temp = "📉 " + parts[0];
          for (let k = 1; k < parts.length; k++) {
            temp += " | " + parts[k];
          }
          lines[i] = temp;
        }
      }
      if (command == "s" || command == "an" || command == "scan") {
        lines.splice(
          0,
          0,
          "<b>Safescan Token Report:</b> Unveiling Key Insights\n"
        );
        lines.push(
          `\n<a href="https://safeaitoken.org">Powered by Safe AI - </a>`
        );

        // splice Chain and Age
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes("🔸")) {
            var parts = lines[i].split(" | ");
            lines.splice(i, 1);
            parts[1] = parts[1].replace("⚖️", "🌘");
            lines.splice(i, 0, parts[1]);
            lines.splice(i, 0, parts[0]);
          }
        }
        // rename Top 10 and splite
        for (let i = 0; i < lines.length; i++) {
          if (
            lines[i].includes("👩‍👧‍👦") &&
            (lines[i].includes("Top 10") || lines[i].includes("Top10"))
          ) {
            var parts = lines[i].split(" | ");
            parts[0] = parts[0].replace("TS", "Total Supply");
            parts[0] = parts[0].replace("👩‍👧‍👦", "🤼");
            parts[1] = parts[1].replace("Top 10", "Top 10 Holders Amount");
            parts[1] = parts[1].replace("Top10", "Top 10 Holders Amount");
            parts[1] = "🔝 " + parts[1];
            lines.splice(i, 1);
            lines.splice(i, 0, parts[1]);
            lines.splice(i, 0, parts[0]);
          }
        }
      }
      processedReply = lines.join("\n");

      // rename ATH
      processedReply = processedReply.replace("ATH", "All Time High");
      processedReply = processedReply.replace("👨‍💻", "👩‍🍳");
      processedReply = processedReply.replace("👤", "👮‍♂️");
      processedReply = processedReply.replace("🔸", "⛓");
      processedReply = processedReply.replace("💳", "🍕");
      processedReply = processedReply.replace("⛽", "🐾");
      processedReply = processedReply.replace("🚫", "🚇");
      processedReply = processedReply.replace("💲", "🤑");
      processedReply = processedReply.replace("🔗", "📎");
      processedReply = processedReply.replace("💸", "💱");
      processedReply = processedReply.replace("💵", "🧧");

      try {
        if (message.photo) {
          const photo = await getMedia(client, message);
          let keyboards = [];
          if (message?.replyMarkup?.rows.length > 0) {
            let temp = [];
            for (let row of message.replyMarkup.rows) {
              for (let but of row.buttons) {
                if (
                  but.text == "Starbot" ||
                  but.text == "Photon" ||
                  but.text == "Scan" ||
                  but.text == "Trend" ||
                  but.text == "Track" ||
                  but.text == "Scan" ||
                  but.text == "Trojan" ||
                  but.text == "Price" ||
                  but.text == "Bubbles" ||
                  but.text == "Top" ||
                  but.text == "🔃" ||
                  but.text == "Wallets" ||
                  but.text == "XCept" ||
                  but.text == "Analyze"
                )
                  continue;
                else
                  temp.push({
                    text: but.text,
                    callback_data: but.text,
                    ...but,
                  });
              }
            }
            keyboards = temp;
          }
          // add buttons for analyze command
          var additional_buttons = [];
          if (command == "s" || command == "an" || command == "scan") {
            additional_buttons.push({
              text: "Audit",
              callback_data: "analyze",
              message: "analyze",
              url: "https://t.me/safescan0bot",
            });

            additional_buttons.push({
              text: "Signal",
              callback_data: "analyze",
              message: "analyze",
              url: "https://web.telegram.org/k/#-2171686020",
            });
          }
          var completed_keyboard = [];
          completed_keyboard.push(keyboards);
          completed_keyboard.push(additional_buttons);
          const keyboard = {
            inline_keyboard: completed_keyboard,
          };
          if (command == "s" || command == "an" || command == "scan") {
            const filePath = path.join(__dirname, "./", `logo.jpeg`);
            console.log("hello-------------------", filePath);
            const res = await bot.telegram.sendPhoto(
              client.ctx.chat.id,
              Input.fromLocalFile(filePath),
              {
                caption: processedReply,
                reply_markup: keyboard,
                parse_mode: "HTML",
                disable_web_page_preview: true,
              }
            );
            actions.push({
              clientId: key.api_id,
              message: message,
              messageId: message.id,
              chatId: client.ctx.chat.id,
              chatMessageId: res.message_id,
              command: clientData.lastCommand,
            });
          } else {
            const res = await bot.telegram.sendPhoto(
              client.ctx.chat.id,
              photo,
              {
                reply_markup: keyboard,
                parse_mode: "HTML",
                // caption_entities: message.entities,
                caption: processedReply || "",
                disable_web_page_preview: true,
              }
            );

            actions.push({
              clientId: key.api_id,
              message: message,
              messageId: message.id,
              chatId: client.ctx.chat.id,
              chatMessageId: res.message_id,
              command: clientData.lastCommand,
            });
          }
        } else if (message.message) {
          let keyboards = [];

          if (message?.replyMarkup?.rows.length > 0) {
            let temp = [];
            for (let row of message.replyMarkup.rows) {
              for (let but of row.buttons) {
                if (
                  but.text == "Starbot" ||
                  but.text == "Photon" ||
                  but.text == "Scan" ||
                  but.text == "Trend" ||
                  but.text == "Track" ||
                  but.text == "Scan" ||
                  but.text == "Trojan" ||
                  but.text == "Price" ||
                  but.text == "Bubbles" ||
                  but.text == "Top" ||
                  but.text == "🔃" ||
                  but.text == "Wallets" ||
                  but.text == "XCept" ||
                  but.text == "Early" ||
                  but.text == "Airdrops" ||
                  but.text == "Analyze"
                )
                  continue;
                else
                  temp.push({
                    text: but.text,
                    callback_data: but.text,
                    ...but,
                  });
              }
            }
            keyboards.push(temp);
          }

          let temp = [];
          if (command == "s" || command == " scan" || command == "an") {
            temp.push({
              text: "Audit",
              callback_data: "analyze",
              message: "analyze",
              url: "https://t.me/safescan0bot",
            });

            temp.push({
              text: "Signal",
              callback_data: "analyze",
              message: "analyze",
              url: "https://web.telegram.org/k/#-2171686020",
            });
            keyboards.push(temp);
          }
          const keyboard = {
            inline_keyboard: keyboards,
          };

          {
            const res = await bot.telegram.sendMessage(
              client.ctx.chat.id,
              processedReply,
              {
                reply_markup: keyboard,
                parse_mode: "HTML",
                disable_web_page_preview: true,
              }
            );

            actions.push({
              clientId: key.api_id,
              message: message,
              messageId: message.id,
              chatId: client.ctx.chat.id,
              chatMessageId: res.message_id,
              command: clientData.lastCommand,
            });
          }
        }

        // bot is finished pirb is generating the HoldersMap
        if (checkIfGenerating(message.message)) {
          {
            clientData.lastCommand = null;
            clientData.isAvailable = true;
            clientData.lastTime = Date.now();
            isWaitingResponse[client.ctx.chat.id] = {
              status: false,
              lastTIme: Date.now(),
            };
          }
        }
      } catch (err) {
        const res = await bot.telegram.sendMessage(
          client.ctx.chat.id,
          "Please try again"
        );
        console.log(err);
      }
    }, new NewMessage({}));
    client.addEventHandler(async (event) => {
      const message = event.message;

      const data = await getMessageIdForUser({
        clientId: key.api_id,
        messageId: message.id,
      });

      if (data == null) return;

      const messageId = data.chatMessageId;
      const chatId = data.chatId;

      data.message = message;

      // Get the command only
      const command = data.command?.split(" ")[0].substring(1);
      const address = data.command?.split(" ")[1] || "";
      // Todo : Here message will be processed alongwith its command

      let processedReply = parseHtmlWithEntities(
        message.message,
        message.entities
      );
      // https://t.me/Everest_Holland
      if (
        processedReply.includes(
          `<a href="https://t.me/hosnybtw"><b>Administrator</b></a>`
        )
      ) {
        processedReply = processedReply.replace(
          "https://t.me/hosnybtw",
          "https://t.me/Everest_Holland"
        );
      }
      let lines = processedReply.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("⚡")) {
          lines.splice(i, 1);
          break;
        }
      }
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("Chart for")) {
          lines.splice(i, 1);
          break;
        }
      }
      processedReply = lines.join("\n");

      if (command == "ts") {
        processedReply = parseHtmlWithEntities(
          message.message,
          message.entities
        );
        // processedReply = processedReply.replace(
        //   /<code>Ad:<\/code>.*$/,
        //   `${customAds}`
        // ); //XALPHA
        processedReply = processedReply
          .replaceAll("| Summarize", "")
          .replaceAll("🐦", " 🔊"); // | Summarize
        // For the f command we have to convert <500 to < 500
        processedReply = processedReply
          .replaceAll("<500", "0 to 500")
          .replaceAll("🥇", "1️⃣")
          .replaceAll("🥈", "2️⃣")
          .replaceAll("🥉", "3️⃣");
        processedReply = processedReply.replaceAll(
          `<a href="https://dexscreener.com/ethereum/0x369733153e6e08d38f2bc72ae2432e855cfbe221">XALPHA</a>`,
          `<a href="https://dexscreener.com/ethereum/0x73454acfddb7a36a3cd8eb171fbea86c6a55e550">BUILD</a>`
        );
      }

      processedReply = removeMsg(processedReply);
      // processedReply = await parse(processedReply, command, address);

      // Sandokan's work
      // Process messaage here processedReply

      //const senderId = message.senderId;
      try {
        if (message.photo && command != "analyze") {
          const photo = await getMedia(client, message);
          let keyboards = [];
          if (message?.replyMarkup?.rows.length > 0)
            for (let row of message.replyMarkup.rows) {
              let temp = [];
              for (let but of row.buttons) {
                if (
                  but.text == "Starbot" ||
                  but.text == "Photon" ||
                  but.text == "Scan" ||
                  but.text == "Trend" ||
                  but.text == "Track" ||
                  but.text == "Scan" ||
                  but.text == "Trojan" ||
                  but.text == "Price" ||
                  but.text == "Bubbles" ||
                  but.text == "Top" ||
                  but.text == "🔃" ||
                  but.text == "Wallets" ||
                  but.text == "XCept" ||
                  but.text == "Analyze"
                )
                  continue;
                temp.push({
                  text: but.text,
                  callback_data: but.text,
                  ...but,
                });
              }
              keyboards.push(temp);
            }
          const keyboard = {
            inline_keyboard: keyboards,
          };
          if (processedReply != "") {
            console.log(processedReply);
            let lines = processedReply.split("\n");
            // split marketcap and liquidity for edit message
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes("💰")) {
                var parts = lines[i].split(" | ");
                lines.splice(i, 1);
                parts[0] = parts[0].replace("MC", "Market Cap");
                parts[1] = parts[1].replace("Liq", "Liquidity");
                parts[1] = "🥃 " + parts[1];
                lines.splice(i, 0, parts[1]);
                lines.splice(i, 0, parts[0]);
              }
            }

            // remove photon and avi links for edit messages
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes("📊") && lines[i].includes("Dex")) {
                var parts = lines[i].split(" | ");
                for (let j = 0; j < parts.length; j++) {
                  if (parts[j].includes("Photon")) {
                    parts.splice(j, 1);
                  }
                  if (parts[j].includes("Ave.ai")) {
                    parts.splice(j, 1);
                  }
                }
                var temp = "📉 " + parts[0];
                for (let k = 1; k < parts.length; k++) {
                  temp += " | " + parts[k];
                }
                lines[i] = temp;
              }
            }
            processedReply = lines.join("\n");
            await bot.telegram.editMessageMedia(
              chatId,
              messageId,
              null,
              {
                type: "photo",
                media: photo,
                parse_mode: "HTML",
                caption: processedReply || "",
                // caption: message.message,
                disable_web_page_preview: true,
              },
              {
                reply_markup: keyboard,
              }
            );
          }
        } else if (message.message) {
          let keyboards = [];
          if (command == "ts") {
            if (message?.replyMarkup?.rows.length > 0) {
              {
                let temp = [];
                for (let row of message.replyMarkup.rows) {
                  for (let but of row.buttons) {
                    if (
                      but.text == "more" ||
                      but.text == "scan" ||
                      but.text == "dyor" ||
                      but.text == "kols" ||
                      but.text == "leader" ||
                      but.text == "latest" ||
                      but.text.includes("PIRB")
                    )
                      continue;
                    temp.push({
                      text: but.text,
                      callback_data: but.text,
                      ...but,
                    });
                  }
                }
                keyboards.push(temp);
              }
            }
          }
          const keyboard = {
            inline_keyboard: keyboards,
          };

          {
            await bot.telegram.editMessageText(
              chatId,
              messageId,
              null,
              // message.message,
              processedReply,
              {
                parse_mode: "HTML",
                reply_markup: keyboard,
                disable_web_page_preview: true,
              }
            );
          }
        }
      } catch (err) {
        console.log(err);
      }
    }, new EditedMessage({}));

    client.addEventHandler(async (event) => {
      const message = event.message;
      //const senderId = message.senderId;
      try {
        for (let id of event.deletedIds) {
          const data = await getMessageIdForUser({
            clientId: key.api_id,
            messageId: id,
          });
          if (data == null) continue;
          let messageId = data.chatMessageId;
          let chatId = data.chatId;
          await bot.telegram.deleteMessage(chatId, messageId);
        }
      } catch (err) {
        console.log(err);
      }
    }, new DeletedMessage({}));

    const data = {
      id: key.api_id,
      bot: client,
      isAvailable: true,
      lastCommand: null,
      lastTime: Date.now(),
      messages: [],
    };
    data[BOT_PROVIDER_PIRB] = pirbId;
    data[BOT_PROVIDER_OttoSim] = ottoId;
    data[BOT_PROVIDER_ALPHA] = xId;
    data[BOT_PROVIDER_TTF] = ttfId;
    clientList.push(data);
  } catch (err) {
    // If client is live yet, send this msg
    console.log(err);
  }
};

const initClients = async () => {
  for (let key of configKeys) {
    try {
      await connectClient(key);
    } catch (err) {
      console.log(err);
    }
  }
};

//#region  get available client
const getAvailableClient = () => {
  if (clientList.length > 0) {
    if (clientList[0].isAvailable == true) {
      let client = clientList.shift();
      clientList.push(client);
      return clientList.length - 1;
    }
    return null;
  }
  return null;
};

const getAvailableClientPromise = () => {
  let cnt = 0;
  return new Promise((res, rej) => {
    const interval = setInterval(() => {
      cnt++;
      const index = getAvailableClient();
      if (index != null) {
        clearInterval(interval);

        return res(index);
      }
    }, [1000]);
  });
};

//#region  get bot id from message
const getBotIdFromCommand = (command) => {
  if (
    command == "scan" ||
    command == "an" ||
    command == "s" ||
    command == "info" ||
    command == "i" ||
    command == "holders" ||
    command == "h" ||
    command == "bubbles" ||
    command == "b" ||
    command == "airdrops" ||
    command == "a" ||
    command == "early" ||
    command == "e" ||
    command == "chart" ||
    command == "c" ||
    command == "1m" ||
    command == "15m" ||
    command == "30m" ||
    command == "1h" ||
    command == "4h" ||
    command == "6h" ||
    command == "1d" ||
    command == "1w" ||
    command == "tax" ||
    command == "t" ||
    command == "portfolio" ||
    command == "pf"
  )
    return BOT_PROVIDER_TTF;
  // if (
  //   command == "gas" || // ta ma  smi   bol   ema  h    team    tax   pnl
  //   command == "fear" ||
  //   command == "market" ||
  //   command == "c" ||
  //   command == "ta" ||
  //   command == "smi" ||
  //   command == "bol" ||
  //   command == "ema" ||
  //   command == "h" ||
  //   command == "pnl" ||
  //   command == "ma" ||
  //   command == "whale" ||
  //   command == "jeet" ||
  //   command == "cross" ||
  //   command == "airdrop" ||
  //   command == "hmp" ||
  //   command == "e"
  // )
  //   return BOT_PROVIDER_PIRB;
  // else if (command == "analyze") return BOT_PROVIDER_OttoSim;
  // else if (
  //   command == "x" ||
  //   command == "cmt" ||
  //   command == "kol" ||
  //   command == "htag" ||
  //   command == "ctag" ||
  //   command == "t"
  // ) {
  //   return BOT_PROVIDER_ALPHA;
  // } else if (command == "tax" || command == "team") return BOT_PROVIDER_TTF;
  return null;
};

//#region  send message to bot provider
const sendMessageToBot = async (client, botId, message) => {
  try {
    command = message.replace("/an ", "");
    bot.telegram.sendChatAction(client.bot.ctx.chat.id, "typing");
    const res = await client.bot.sendMessage(client[botId], {
      message: command,
    });
  } catch (err) {
    console.log(err);
  }
};
const startBot = () => {
  try {
    // set the bot profile logo

    bot.telegram.setChatMenuButton("main");
    bot.telegram.setMyCommands([
      { command: "/start", description: "Start with SafeScanBot" },
      { command: "/scan", description: "Scan Contract Address" },
      { command: "/advertise", description: "Advertise with SafeScanBot" },
      { command: "/chart", description: "Show you briefly price chart" },
      { command: "/holders", description: "Show you top token holders" },
      { command: "/tax", description: "Show you token tax report" },
    ]);
    bot.start(async (ctx) => {
      ctx.reply(
        "<b>Welcome to SafeScan:</b> \n\n A streamlined contract analysis bot that allows users to effortlessly scan contracts for potential vulnerabilities. Additionally, SafeScan leverages user activity data to ensure targeted advertising for projects seeking promotion within the platform.\n\nSafeScan is fully powered by Safe AI - www.safeaitoken.org \n\nPaste your contract to begin or check the menu",
        {
          parse_mode: "HTML",
        }
      );
      const chatID = ctx.message.chat.id;
      const userName = ctx.message.chat.username;
      const firstName = ctx.message.chat.first_name;
      // await getAndCheckUserConfig(
      //   chatID,
      //   userName ?? "unknown",
      //   firstName ?? "unknown"
      // );
    });
    bot.launch();

    bot.on("callback_query", async (ctx) => {
      // const action = callbackQuery.update.callback_query.data;
      try {
        const data = await getMessageIdForUser({
          chatId: ctx.chat.id,
          chatMessageId: ctx.msgId,
        });
        if (data == null) {
          if (ctx.update.callback_query.data[0] == "/") {
            const command = ctx.update.callback_query.data
              .split(" ")[0]
              .substring(1);
            const botProvider = getBotIdFromCommand(command);

            if (botProvider == null) {
              ctx.reply("This command is not available");
            } else {
              const index = await getAvailableClientPromise();
              clientList[index].bot.ctx = ctx;
              let tmpCommand = ctx.update.callback_query.data;
              if (
                ctx.update.callback_query.data.includes("airdrop") ||
                ctx.update.callback_query.data.includes("cmt") ||
                ctx.update.callback_query.data.includes("hmp") ||
                ctx.update.callback_query.data.includes("htag") ||
                ctx.update.callback_query.data.includes("ctag") ||
                ctx.update.callback_query.data.includes("jeet") ||
                ctx.update.callback_query.data.includes("cross")
              ) {
                tmpCommand = tmpCommand.replace("airdrop", "a");
                tmpCommand = tmpCommand.replace("cmt", "f");
                tmpCommand = tmpCommand.replace("hmp", "hmap");
                tmpCommand = tmpCommand.replace("htag", "th");
                tmpCommand = tmpCommand.replace("ctag", "ts");
                tmpCommand = tmpCommand.replace("jeet", "j");
                tmpCommand = tmpCommand.replace("cross", "o");
              }

              clientList[index].lastCommand = tmpCommand;
              clientList[index].isAvailable = false;
              clientList[index].messages = [];
              isWaitingResponse[ctx.chat.id] = {
                status: true,
                lastTime: Date.now(),
              };
              ctx
                .answerCbQuery(
                  `${GetAnswer(
                    ctx.update.callback_query.data.split(" ")[0].substring(1)
                  )}`
                )
                .then()
                .catch();

              await sendMessageToBot(
                clientList[index],
                botProvider,
                // ctx.message.text,
                tmpCommand
              );
            }
          }
          return;
        }

        const action = data.message;
        if (action) {
          // await action.click({
          //   text: ctx.update.callback_query.data,
          // });
          {
            var command = ctx.update.callback_query.data.toLowerCase();
            if (command === "taxes") command = "tax";
            const address = data.command?.split(" ")[1];
            const botProvider = getBotIdFromCommand(command);

            const clientData = getClientStatus(data.clientId);

            clientData.bot.ctx = ctx;

            clientData.lastCommand = ctx.update.callback_query.data;
            clientData.isAvailable = false;
            clientData.messages = [];
            isWaitingResponse[ctx.chat.id] = {
              status: true,
              lastTime: Date.now(),
            };

            await action.click({ text: ctx.update.callback_query.data });
            // if (botProvider == null) {
            //   await action.click({
            //     text: ctx.update.callback_query.data,
            //   });
            // } else {
            //   const index = await getAvailableClientPromise();
            //   clientList[index].bot.ctx = ctx;
            //   let tmpCommand = "/" + command + " " + address;
            //   if (
            //     ctx.update.callback_query.data.includes("airdrop") ||
            //     ctx.update.callback_query.data.includes("cmt") ||
            //     ctx.update.callback_query.data.includes("hmp") ||
            //     ctx.update.callback_query.data.includes("htag") ||
            //     ctx.update.callback_query.data.includes("ctag") ||
            //     ctx.update.callback_query.data.includes("jeet") ||
            //     ctx.update.callback_query.data.includes("cross")
            //   ) {
            //     tmpCommand = tmpCommand.replace("airdrop", "a");
            //     tmpCommand = tmpCommand.replace("cmt", "f");
            //     tmpCommand = tmpCommand.replace("hmp", "hmap");
            //     tmpCommand = tmpCommand.replace("htag", "th");
            //     tmpCommand = tmpCommand.replace("ctag", "ts");
            //     tmpCommand = tmpCommand.replace("jeet", "j");
            //     tmpCommand = tmpCommand.replace("cross", "o");
            //   }

            //   clientList[index].lastCommand = tmpCommand;
            //   clientList[index].isAvailable = false;
            //   clientList[index].messages = [];
            //   isWaitingResponse[ctx.chat.id] = {
            //     status: true,
            //     lastTime: Date.now(),
            //   };
            //   ctx
            //     .answerCbQuery(`${GetAnswer(ctx.update.callback_query.data)}`)
            //     .then()
            //     .catch();

            //   await sendMessageToBot(
            //     clientList[index],
            //     botProvider,
            //     // ctx.message.text,
            //     tmpCommand
            //   );
            // }
          }
        }
      } catch (err) {
        console.log(err);
      }
    });
    bot.on("message", async (ctx) => {
      try {
        if (ctx.message.text === "/advertise") {
          return ctx.reply(
            "<b>Advertise with SafeScan</b>\n\nMassive Reach 🚀 \n\n》 60k+ daily scans \n》10k groups\n》40k users\n\nBanner Ads on SafeScan:\n》 0.1 Eth for 3days\n》 0.2 Eth for 1week\n》 0.3 Eth for 2weeks\n\nMass DM to Users: \n》0.3 Eth for 1 Mass DM\n》0.5 Eth for 3 Mass DM\n\nTo book or reserve an ads, contact @Dev_Eric1\n\nNote: We strive to bring you valuable promotions.  In the unlikely event a scam is discovered, we will cancel it and provide a clear explanation.  Unfortunately, refunds wouldn't be possible in such cases.",
            {
              parse_mode: "HTML",
            }
          );
        }
        const chatID = ctx.message.chat.id;
        const userName = ctx.message.chat.username;
        if (ctx.message.text.split(" ").length === 1) {
          ctx.message.text = "/an " + ctx.message.text;
        }
        let command = ctx.message.text?.split(" ")[0].substring(1);
        let address = ctx.message.text?.split(" ")[1];
        const address_second = ctx.message.text?.split(" ")[2];

        const isAddress = isValidEthAddress(address);
        const isAddressSecond = isValidEthAddress(address_second);

        const isWaiting = isWaitingResponse[ctx.chat.id];

        if (
          isWaiting &&
          isWaiting.status == true &&
          ctx.chat.type === "private"
        ) {
          ctx.reply("Wait until prev command completed");
          return;
        }

        {
          if (availableCommands.includes(command)) {
            const botProvider = getBotIdFromCommand(command);
            if (botProvider == null) {
              ctx.reply("This command is not available");
            } else {
              console.log("waiting for avaialble client....");
              try {
                const index = await getAvailableClientPromise();

                clientList[index].bot.ctx = ctx;

                let tmpCommand = ctx.message.text;

                clientList[index].lastCommand = tmpCommand;
                clientList[index].isAvailable = false;
                clientList[index].messages = [];
                isWaitingResponse[ctx.chat.id] = {
                  status: true,
                  lastTime: Date.now(),
                };
                {
                  sendMessageToBot(
                    clientList[index],
                    botProvider,
                    // ctx.message.text,
                    tmpCommand
                  );
                }
              } catch (err) {
                ctx.reply(
                  "If you send bulk messages, then you will be restricted by scam"
                );
              }
            }
          } else {
            ctx.reply("This command is not valid");
          }
        }
      } catch (err) {
        console.log(err);
      }
    });
  } catch (err) {
    console.log(err);
  }
};

const monitorClients = () => {
  setInterval(() => {
    const currentTime = Date.now();
    for (let client of clientList) {
      if (
        client.isAvailable == false &&
        currentTime > client.lastTime + 3 * 60 * 1000
      ) {
        client.isAvailable = true;
        client.lastTime = currentTime;
      }
    }
    for (let key of Object.keys(isWaitingResponse)) {
      if (
        isWaitingResponse[key].status == true &&
        currentTime >= isWaitingResponse[key].lastTime + 3 * 60 * 1000
      ) {
        isWaitingResponse[key].status = false;
        isWaitingResponse[key].lastTime = currentTime;
        bot.telegram.sendMessage(
          key,
          "Your command has been returned without any response"
        );
      }
    }
  }, [1000]);
};

const main = async () => {
  try {
    await initClients();

    // bot start
    startBot();
    monitorClients();
  } catch (err) {
    console.log(err);
  }
};

main();
