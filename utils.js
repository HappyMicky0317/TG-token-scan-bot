// const { getAdvertisement } = require("./advertise");
const {
  keyboardsAnalyze,
  OttoSimBotChatId,
  PirbChatId,
  TTFBotChatId,
  NonSupport,
} = require("./constant");
const {
  parseFormatedPrice,
  parseFormatedPercentage,
  hashCode,
} = require("./parse");

const match = (a, b, caseIncensitive = true) => {
  if (a === null || a === undefined) return false;

  if (Array.isArray(b)) {
    if (caseIncensitive) {
      return b.map((x) => x.toLowerCase()).includes(a.toLowerCase());
    }

    return b.includes(a);
  }

  if (caseIncensitive) {
    return a.toLowerCase() === b.toLowerCase();
  }
  return a === b;
};

const truncateEthAddress = (address, startLength = 6, endLength = 4) => {
  if (!address || address.length < startLength + endLength + 1) {
    return address;
  }

  const truncatedAddress = `${address.substring(
    0,
    startLength + 2
  )}...${address.substring(address.length - endLength)}`;
  return truncatedAddress;
};

const findAndRemoveBotCommand = (array, sc, userid) => {
  const index = array.findIndex(
    (item) => match(item.sc, sc) && item.userid === userid
  );
  if (index !== -1) {
    const curCmd = array[index].command;

    array.splice(index, 1); // Remove the element from the array
    return curCmd; // Return 'yes' if found
  }
  return undefined; // Return 'no' if not found
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isValidEthAddress = (address) => {
  if (!/^(0x)?[0-9a-fA-F]{40}$/.test(address)) {
    return false; // Invalid ETH address
  }
  return true; // Valid ETH address
};

const getSecurity = (lineArray) => {
  const regex = new RegExp("`", "g");
  let lineSec = "",
    lineCh = "";
  for (var i = 0; i < lineArray.length; i++) {
    if (lineArray[i].includes("Token Security:")) {
      lineSec = lineArray[i] + "\n\n";
    }

    if (lineArray[i].includes("📊 Charts:")) {
      lineCh = lineArray[i] + "\n\n";
    }
  }

  let isRe = lineSec.charAt(lineSec.indexOf("Renounced") - 2);
  let isVe = lineSec.charAt(lineSec.indexOf("Verified") - 2);
  let isLo = lineSec.charAt(lineSec.indexOf("Locked") - 2);

  lineSec = "<b><u>Token Security:</u></b>\n";
  if (isRe) lineSec += "⁉ Renounced: " + isRe + "\n";
  if (isVe) lineSec += "🚦 Verified:        " + isVe + "\n";
  if (isLo) lineSec += "🔒 Locked:         " + isLo + "\n\n";

  return lineSec + lineCh;
};

const getLockState = (lineArray) => {
  const regex = new RegExp("`", "g");
  for (var i = 0; i < lineArray.length; i++) {
    if (lineArray[i].includes("🔐")) {
      return lineArray[i].replace(regex, "") + "\n";
    }
  }
  return "";
};
const getTaxInfo = (lineArray) => {
  const regex = new RegExp("`", "g");
  for (var i = 0; i < lineArray.length; i++) {
    if (lineArray[i].includes("💸")) {
      // const lastIndex = lineArray[i].lastIndexOf("|");
      // if (lastIndex !== -1) {
      //   // Slice the string until the found index
      //   return lineArray[i].slice(0, lastIndex).replace(regex, "") + "\n\n";
      // } else {
      //   return lineArray[i].replace(regex, "") + "\n\n";
      // }
      return lineArray[i].replace("Xfer", "Transfer") + "\n\n";
    }
  }
  return "";
};

const getAge = (lineArray) => {
  const regex = new RegExp("`", "g");
  for (var i = 0; i < lineArray.length; i++) {
    if (lineArray[i].includes("⏱️")) {
      return lineArray[i].replace(regex, "") + "\n";
    }
  }
  return "";
};

const getMaxLimit = (lineArray) => {
  let res = "";
  const regex = new RegExp("`", "g");
  for (var i = 0; i < lineArray.length; i++) {
    if (lineArray[i].includes("💰") || lineArray[i].includes("💼")) {
      res += lineArray[i].replace(regex, "") + "\n";
    }
  }
  if (res == "") {
    return "";
  }
  return res + "\n";
};

const getContractBalance = (lineArray) => {
  const regex = new RegExp("`", "g");
  for (var i = 0; i < lineArray.length; i++) {
    if (lineArray[i].includes("🧺")) {
      return lineArray[i].replace(regex, "") + "\n";
    }
  }
  return "";
};

const getPoolStat = (lineArray) => {
  const regex = new RegExp("`", "g");
  for (var i = 0; i < lineArray.length; i++) {
    if (lineArray[i].includes("💧")) {
      return (
        lineArray[i]
          .replace(regex, "")
          .replace("LIQ", "<b>LIQ</b>")
          .replace("MC", "<b>MC</b>")
          .replace("(FDV)", "") + "\n"
      );
    }
  }
  return "";
};

const getDeployer = (entities) => {
  for (var i = 0; i < entities.length; i++) {
    if (entities[i].className == "MessageEntityTextUrl") {
      if (
        entities[i].url.includes("https://etherscan.io/address/") ||
        entities[i].url.includes("https://bscscan.com/address/")
      ) {
        return (
          "🪪 Deployer: " +
          '<a href="' +
          entities[i].url +
          '">' +
          truncateEthAddress(
            entities[i].url
              .replace("https://etherscan.io/address/", "")
              .replace("https://bscscan.com/address/", "")
          ) +
          "</a>" +
          "\n\n"
        );
      }
    }
  }
  return "";
};

const getTokenSocial = (lineArray) => {
  let res = "";
  for (let i = 0; i < lineArray.length; i++) {
    if (lineArray[i].includes("Token Socials:")) {
      res += lineArray[i] + "\n\n";
    }
  }
  return res;
};

const getCurrentPrice = (lineArray) => {
  let res = "";
  for (var i = 0; i < lineArray.length; i++) {
    if (lineArray[i].includes("💵")) {
      let parts = lineArray[i].split(":");
      res += parts[0] + "\n";
      res += "└" + parts[1] + "\n";
      if (lineArray[i + 1].includes("└")) {
        let tmp = lineArray[i + 1].replace("💵", "🏷");
        let index = tmp.indexOf("|  <code>6H");
        let indext = tmp.indexOf("|  <code>1D");

        let newt = tmp.substring(0, index) + tmp.substring(indext);
        res += newt + "\n\n";
      }
    }
  }
  if (res !== "") return res;
  return "";
};

const getCurrentVolume = (lineArray) => {
  let res = "";
  for (var i = 0; i < lineArray.length; i++) {
    if (lineArray[i].includes("💠")) {
      if (lineArray[i + 1].includes("└")) {
        let tmp = lineArray[i + 1];
        let index = tmp.indexOf("<code>1H: ");
        tmp = tmp.substring(index);
        res += "🎚 Volume: \n" + "└" + tmp + "\n\n";
      }
      return res;
    }
  }
  return "";
};

const getChartInfo = (msg) => {
  msg = msg.slice(0, msg.indexOf("An in-depth"));
  return msg
    .replace("\n📈 DexTools | DexSpy\n", "")
    .replace("**", "<b>")
    .replace("**", "</b>")
    .replace("**", "<b>")
    .replace("**", "</b>")
    .replace("**", "<b>")
    .replace("**", "</b>")
    .replace("**", "<b>")
    .replace("**", "</b>")
    .replace("**", "<b>")
    .replace("**", "</b>")
    .replace("**", "<b>")
    .replace("**", "</b>")
    .replace("**", "<b>")
    .replace("**", "</b>");
};

const getTopList = (text, entities) => {
  text = text.slice(0, text.indexOf("❇️"));
  const lines = text.split("\n");
  let msg = "";
  msg +=
    '<a href="' +
    getUrlFromEntities(entities, 0) +
    '">' +
    lines[0].replace(/\*/g, "") +
    "</a>" +
    "\n";
  msg += lines[1].replace(/\*/g, "") + "\n";
  for (var i = 2; i < lines.length; i++) {
    if (lines[i].includes("#" + (i - 1))) {
      let partMsg = lines[i].replace("**", "<b>").replace("**", "</b>");
      partMsg = partMsg.slice(0, partMsg.indexOf("|"));
      partMsg +=
        '<a href="' +
        getUrlFromEntities(entities, i - 1) +
        '">' +
        lines[i].slice(lines[i].indexOf("|")) +
        "</a>";

      msg += partMsg + "\n";
    }
  }
  return msg;
};

const getPNL = (text, entities) => {
  let contractIndex = 1;
  const lines = text.split("\n");
  let msg = "";
  for (var i = 0; i < lines.length - 1; i++) {
    const blueCaption = "🟢 " + contractIndex + ". ";
    const redCaption = "🔴 " + contractIndex + ". ";
    if (
      lines[i].includes("🦜") ||
      lines[i].includes("❇️") ||
      lines[i].includes("➡️") ||
      lines[i].includes("An in-depth explanation") ||
      lines[i].includes("Wallet P&L Summary")
    ) {
      continue;
    } else if (lines[i].includes("Last 15 traded tokens")) {
      msg += "<b>" + "Last 15 traded tokens:" + "</b>" + "\n";
    } else if (
      lines[i].includes(blueCaption) ||
      lines[i].includes(redCaption)
    ) {
      const tokenName = lines[i]
        .replace(blueCaption, "")
        .replace(redCaption, "");
      const blueUrl =
        '<a href="' +
        getUrlFromEntities(entities, contractIndex) +
        '">' +
        tokenName +
        "</a>";
      contractIndex++;

      msg += lines[i].replace(tokenName, blueUrl) + "\n";
    } else {
      msg += lines[i] + "\n";
    }
  }
  return msg;
};

const getTeamInfo = (text, entities) => {
  const regex = new RegExp("_", "g");
  const lines = text.split("\n");
  let walletIndex = 0;
  let msg = "";
  for (var i = 0; i < lines.length - 1; i++) {
    if (lines[i].includes("TEAM WALLET ANALYSIS") || lines[i].includes("💳")) {
      msg += lines[i].replace("**", "<b>").replace("**", "</b>") + "\n";
    } else if (lines[i].slice(0, 2) == "By") {
      continue;
    } else if (lines[i].includes("🛠")) {
      const deployerUrl =
        '<a href="' +
        getUrlFromEntities(entities, 0) +
        '">' +
        "Deployer" +
        "</a>";
      msg +=
        lines[i].replace("**Deployer**", deployerUrl).replace(regex, "") + "\n";
    } else if (lines[i].includes("💵")) {
      const txUrl =
        '<a href="' + getUrlFromEntities(entities, 1) + '">' + "Tx" + "</a>";
      msg += lines[i].replace("Tx", txUrl) + "\n";
    } else if (lines[i].includes("**Wallet**")) {
      const txUrl =
        '<a href="' +
        getUrlFromEntities(entities, 2 + walletIndex) +
        '">' +
        "Wallet" +
        "</a>";
      msg += lines[i].replace("**Wallet**", txUrl) + "\n";
      walletIndex++;
    } else {
      msg += lines[i] + "\n";
    }
  }
  return msg;
};

const getMarketingFee = (text, entities) => {
  for (var i = 0; i < 10; i++) {
    text = text.replace("**", "<b>").replace("**", "</b>");
  }
  const lines = text.split("\n");
  let msg = "";
  for (var i = 0; i < lines.length - 1; i++) {
    if (lines[i].includes("Tax report by")) {
      continue;
    } else {
      msg += lines[i] + "\n";
    }
  }
  return msg;
};

const getGas = (text) => {
  for (var i = 0; i < 10; i++) {
    text = text.replace("**", "<b>").replace("**", "</b>");
  }
  const lines = text.split("\n");
  let msg = "";
  for (var i = 0; i < lines.length - 1; i++) {
    msg += lines[i] + "\n";
  }
  return msg;
};

const getIntroduction = () => {
  return "🌐  <b>Build View Analytics</b>\n\n";
};

const getUrlFromEntities = (entities, n) => {
  let index = 0;
  for (var i = 0; i < entities.length; i++) {
    if (entities[i].className == "MessageEntityTextUrl") {
      if (index == n) return entities[i].url;
      index++;
    }
  }
  return "";
};

const getTokenName = (lineArray) => {
  let res = "";
  for (var i = 0; i < lineArray.length; i++) {
    if (lineArray[i].includes("🏷️")) {
      res =
        lineArray[i]
          .replace("`", "<b>")
          .replace("`", "</b>")
          .replace("`", "<b>")
          .replace("`", "</b>") + "\n";
    }
  }
  if (res != "") return res;
  return "";
};

const getTokenAddress = (lineArray) => {
  let res = "";
  for (var i = 0; i < lineArray.length; i++) {
    if (lineArray[i].includes("🔖")) {
      res =
        lineArray[i]
          .replace("`", "<code>")
          .replace("`", "</code>")
          .replace("`", "<code>")
          .replace("`", "</code>") + "\n\n";
    }
  }
  if (res != "") return res;
  return "";
};

const getTokenChain = (lineArray) => {
  let res = "";
  for (var i = 0; i < lineArray.length; i++) {
    if (lineArray[i].includes("🔗")) {
      res =
        lineArray[i]
          .replace("`", "<b>")
          .replace("`", "</b>")
          .replace("`", "<b>")
          .replace("`", "</b>") + "\n";
    }
  }
  if (res != "") return res;
  return "";
};

const getTokenSupply = (lineArray) => {
  let res = "";
  for (var i = 0; i < lineArray.length; i++) {
    if (lineArray[i].includes("🪙")) {
      res =
        lineArray[i]
          .replace("`", "<b>")
          .replace("`", "</b>")
          .replace("`", "<b>")
          .replace("`", "</b>") + "\n";
    }
  }
  if (res != "") return res;
  return "";
};

const getTokenContarct = (entities) => {
  for (var i = 0; i < entities.length; i++) {
    if (entities[i].className == "MessageEntityTextUrl") {
      if (
        entities[i].url.includes("https://etherscan.io/token/") ||
        entities[i].url.includes("https://bscscan.com/token/")
      ) {
        return (
          "📃 Contract: " +
          '<a href="' +
          entities[i].url +
          '">' +
          truncateEthAddress(
            entities[i].url
              .replace("https://etherscan.io/token/", "")
              .replace("https://bscscan.com/token/", "")
          ) +
          "</a>" +
          "\n"
        );
      }
    }
  }
  return "";
};

// To process the tax result
const regexTax = /0x[0-9a-fA-F]+\.{3}[0-9a-fA-F]+/;

const extractAddressTax = (str) => {
  const match = str.match(regexTax);
  return match ? match[0] : null;
};

let regexURL = /<a href="([^"]*)">[^<]*<\/a>/;

const processCmtCommand = (entities, msg) => {
  let link = [];
  let cnt = 0;
  for (var i = 0; i < entities?.length; i++) {
    if (entities[i].className == "MessageEntityTextUrl") {
      if (entities[i].url.includes("https://twitter.com/")) {
        cnt++;
        link.push(entities[i].url);
        if (cnt === 10) break;
      }
    }
  }
  // console.log("################", link);
  const lines = msg.split("\n");
  let cntt = 0;
  for (let i = 0; cntt < cnt; i++) {
    // console.log("*************************************************", i);
    if (lines[i]?.includes("https://t.me/Xalpha_bot")) {
      cntt++;
      // console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%", cntt);
      let indexS = lines[i].indexOf("https://");
      let indexE = lines[i].indexOf(`">`);
      lines[i] = lines[i].replace(
        lines[i].substring(indexS, indexE),
        link.shift()
      );
    }
  }
  let tmp = lines[1];
  // <a href="https://t.me/ttfbotbot?start=0X73454ACFDDB7A36A3CD8EB171FBEA86C6A55E550">$0X73454ACFDDB7A36A3CD8EB171FBEA86C6A55E550</a> Tweets:716

  let indexS = tmp?.indexOf(`">`) + 2;
  let indexE = tmp?.indexOf(`</a>`);
  let indexEE = indexE + 4;
  tmp = tmp?.substring(indexS, indexE) + tmp?.substring(indexEE);
  lines[1] = tmp;
  const result = lines.join("\n");

  return result;
};

const processKolCommand = (entities, msg) => {
  let link = [];
  let cnt = 0;
  for (var i = 0; i < entities?.length; i++) {
    if (entities[i].className == "MessageEntityTextUrl") {
      if (entities[i].url.includes("https://twitter.com/")) {
        cnt++;
        link.push(entities[i].url);
        if (cnt === 10) break;
      }
    }
  }
  // console.log("################", link);
  const lines = msg.split("\n");
  let cntt = 0;
  for (let i = 0; cntt < cnt; i++) {
    // console.log("*************************************************", i);
    if (lines[i]?.includes("https://t.me/Xalpha_bot")) {
      cntt++;
      // console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%", cntt);
      let indexS = lines[i].indexOf("https://");
      let indexE = lines[i].indexOf(`">`);
      lines[i] = lines[i].replace(
        lines[i].substring(indexS, indexE),
        link.shift()
      );
    }
  }
  let tmp = lines[1];
  // <a href="https://t.me/ttfbotbot?start=0X73454ACFDDB7A36A3CD8EB171FBEA86C6A55E550">$0X73454ACFDDB7A36A3CD8EB171FBEA86C6A55E550</a> Tweets:716

  let indexS = tmp?.indexOf(`">`) + 2;
  let indexE = tmp?.indexOf(`</a>`);
  let indexEE = indexE + 4;
  tmp = tmp?.substring(indexS, indexE) + tmp?.substring(indexEE);
  lines[1] = tmp;
  let result = lines.join("\n");

  const lineR = result.split("\n");

  result =
    "𝕏 Community KOL Leaderboard(30D)\n\n" +
    lineR[1] +
    "\n\n" +
    (lineR[5]?.includes("1️⃣") ? lineR[5] + "\n" : "") +
    (lineR[6]?.includes("2️⃣") ? lineR[6] + "\n" : "") +
    (lineR[7]?.includes("3️⃣") ? lineR[7] + "\n" : "") +
    (lineR[8]?.includes("4️⃣") ? lineR[8] + "\n" : "") +
    (lineR[9]?.includes("5️⃣") ? lineR[9] + "\n" : "") +
    (lineR[10]?.includes("6️⃣") ? lineR[10] + "\n" : "") +
    (lineR[11]?.includes("7️⃣") ? lineR[11] + "\n" : "") +
    (lineR[12]?.includes("8️⃣") ? lineR[12] + "\n" : "") +
    (lineR[13]?.includes("9️⃣") ? lineR[13] + "\n" : "") +
    (lineR[14]?.includes("🔟") ? lineR[14] + "\n" : "");

  return result;
};

const handleTaxCmd = (msg, entities) => {
  let link = [];
  for (var i = 0; i < entities.length; i++) {
    if (entities[i].className == "MessageEntityTextUrl") {
      if (
        entities[i].url.includes("https://etherscan.io/") ||
        entities[i].url.includes("https://bscscan.com/")
      ) {
        link.push(entities[i].url);
      }
    }
  }

  const lines = msg.split("\n");

  if (lines.length >= 3) {
    // Add hyperlink to the whole third line
    lines[2] = `<a href="${link[0]}">${lines[2]}</a>`;
  }
  let cnt = 0;
  const linesWithHyperlinks = lines.map((line, index) => {
    if (line.includes("0x")) {
      // const address = line.match(/0x[0-9a-fA-F]+/)[0];
      const address = extractAddressTax(line);
      return line.replace(address, `<a href="${link[cnt++]}">${address}</a>`);
    }
    return line;
  });
  const result = linesWithHyperlinks.join("\n");

  return result;
};

const getTokenBasic = (lineArray) => {
  let res = "";
  for (let i = 0; i < lineArray.length; i++) {
    if (lineArray[i].includes("🏷️")) {
      res += lineArray[i].replace("🏷️", "💲️") + "\n";
    }
    if (lineArray[i].includes("🔖")) {
      res += lineArray[i].replace("🔖", "📌") + "\n";
    }
  }
  return res + "\n";
};

const getTokenMainInfo = (lineArray) => {
  let res = "<b><u>Main Information</u></b>\n";
  // res += "￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣\n"; // ╰(*°▽°*)╯φ(*￣0￣)`(*>﹏<*)′(✿◡‿◡)(〃￣︶￣)人(￣︶￣〃)
  for (let i = 0; i < lineArray.length; i++) {
    if (lineArray[i].includes("🔗 Chain:")) {
      res += lineArray[i].replace("🔗", "⛓") + "\n";
    }
    if (lineArray[i].includes("Contract:")) {
      res += lineArray[i].replace("📃", "🔖") + "\n";
    }
    if (lineArray[i].includes("Supply")) {
      res += lineArray[i].replace("🪙", "📊") + "\n";
    }
    if (lineArray[i].includes("Deployer")) {
      res += lineArray[i].replace("🪪", "👨🏻‍💼") + "\n";
    }
  }
  return res + "\n";
};

const getTokenBalanceHolders = (lineArray) => {
  let res = "";
  for (let i = 0; i < lineArray.length; i++) {
    if (lineArray[i].includes("Balances")) {
      res += lineArray[i].replace("🔗", "⛓") + "\n";
    }
    if (lineArray[i].includes("Holders:")) {
      let tmp = lineArray[i];
      let index = tmp.indexOf("|  🍩");
      let indext = tmp.indexOf("|  🍿");
      tmp = tmp.substring(0, index) + tmp.substring(indext) + "\n";
      tmp = tmp.replace("👥", "👩‍👧‍👦").replace("🍿", "🐳");
      res += tmp;
    }
  }
  return res + "\n";
};

const getTokenAgePools = (lineArray) => {
  let res = "<b><u>Token Stats:</u></b>\n";
  for (let i = 0; i < lineArray.length; i++) {
    if (lineArray[i].includes("Age")) {
      let tmp = lineArray[i];
      let index = tmp.indexOf("|");
      res += tmp.substring(0, index).replace("🔗", "⛓") + "\n";
    }
    if (lineArray[i].includes("Pools:")) {
      let tmp = lineArray[i];
      let index = tmp.indexOf("|");
      tmp = tmp.substring(0, index).replace("🔗", "⛓") + "\n";
      res += tmp;
    }
  }
  return res + "\n";
};

const debounce = (fn, timeout = 1000) => {
  let timeOutHandler = null;
  return function (...args) {
    clearTimeout(timeOutHandler);
    timeOutHandler = setTimeout(() => {
      fn(...args);
    }, timeout);
  };
};

const checkMessages = (messages) => {
  let otto = messages.find((message) => message.id == OttoSimBotChatId);
  let pirb = messages.find((message) => message.id == PirbChatId);
  let ttf = messages.find((message) => message.id == TTFBotChatId);
  if (otto && pirb && ttf) {
    return true;
  }
  return false;
};
const sendAnalyzedMessage = async (
  bot,
  chatId,
  messages,
  option,
  currentAd
) => {
  try {
    let otto = messages.find((message) => message.id == OttoSimBotChatId);
    let pirb = messages.find((message) => message.id == PirbChatId);
    let ttf = messages.find((message) => message.id == TTFBotChatId);
    let message = getTokenDetails(
      otto?.message || "",
      pirb?.message || "",
      ttf?.message || ""
    );
    if (message == false) {
      await bot.telegram.sendMessage(chatId, NonSupport);
      return;
    } else {
      // const data = await getAdvertisement(currentAd.index);

      // if (data != null) {
      //   message = message + "\n\n" + data.message;
      //   currentAd.index = data.index;
      // }

      await bot.telegram.sendMessage(chatId, message, option);
    }

    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};
const getHolderMessage = (pirb, ttf) => {
  // const pirbData = {
  //   holdersNumber: 15,
  //   tokenAddress: "",
  //   scanUrl: "",
  //   chain: "BNBChain",
  // };
  let result = "";
  let pirbArray = pirb.split("\n");
  let ttfArray = ttf.split("\n");
  for (let index = 0; index < pirbArray.length; index++) {
    let msg = pirbArray[index];
    if (msg.indexOf("Fresh wallets") >= 0) break;
    else result = result + msg + "\n";
  }
  for (let index = 0; index < ttfArray.length; index++) {
    let msg = ttfArray[index];
    if (msg.indexOf("ETH/USDT Balances") >= 0) {
      let k = 0;
      while (k < 5) {
        result = result + ttfArray[index + k] + "\n";
        k++;
      }
      result = result + "</code>";
    }
  }
  return result;
};
const sendHoldersMessage = async (bot, chatId, messages, option, currentAd) => {
  try {
    let pirb = messages.find((message) => message.id == PirbChatId);
    let ttf = messages.find((message) => message.id == TTFBotChatId);
    let message = getHolderMessage(pirb?.message, ttf?.message);

    // const data = await getAdvertisement(currentAd.index);

    // if (data != null) {
    //   message = message + "\n\n" + data.message;
    //   currentAd.index = data.index;
    // }

    await bot.telegram.sendMessage(chatId, message, option);

    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};
function extractCodeValueFromString(str) {
  const regex = /<code>(.*?)<\/code>/;
  const match = str.match(regex);

  if (match) {
    return match[1]; // Extracted value inside <code> tag
  } else {
    return "Code element not found in the string";
  }
}

function extractNumbersOnly(str) {
  return str.split(": ")[1].replace("$", "").replace("%", "");
}
const getTokenDetails = (ottoMessage, pirbMessage, ttfMessage) => {
  const data = {};
  let ottoMessageArray = ottoMessage.split("\n");
  let pirbMessageArray = pirbMessage.split("\n");
  let ttfMessageArray = ttfMessage.split("\n");
  for (let i = 0; i < ottoMessageArray.length; i++) {
    let message = ottoMessageArray[i];
    if (message.indexOf("💲 ") === 0) {
      data["token_name"] = message.substring(2);
    }
    if (message.indexOf("🔖 ") === 0) {
      data["token_address"] = extractCodeValueFromString(message.substring(2));
    }
    if (message.indexOf("🔗 Chain: ") === 0) {
      data["chain"] = extractCodeValueFromString(message.substring(9));
      if (
        data["chain"].indexOf("BSC") >= 0 ||
        data["chain"].indexOf("ETH") >= 0
      )
        continue;
      else return false;
    }
    if (message.indexOf("📃 Contract: ") === 0) {
      data["contract"] = message.substring(12);
    }
    if (message.indexOf("🪙 Supply: ") === 0) {
      data["supply"] = extractCodeValueFromString(message.substring(10));
    }
    if (message.indexOf("<b>Token Security:</b>") === 0) {
      let t = message.substring(23).split("|");
      data["renounced"] = t[0].trim();
      data["verified"] = t[1].trim();
      data["locked"] = t[2].trim();
    }
    if (message.indexOf("💸 Taxes: ") === 0) {
      let t = message.substring(9).split("|");
      data["buy_tax"] = extractCodeValueFromString(t[0]).split("%")[0];
      data["sell_tax"] = extractCodeValueFromString(t[1]).split("%")[0];
      data["xfer_tax"] = extractCodeValueFromString(t[2]).split("%")[0];
    }
    if (message.indexOf("💵 Price: ") === 0) {
      let t = ottoMessageArray[i + 1].substring(2).split("|");
      data["price_5m"] = extractNumbersOnly(extractCodeValueFromString(t[0]));
      data["price_1h"] = extractNumbersOnly(extractCodeValueFromString(t[1]));
      data["price_1d"] = extractNumbersOnly(extractCodeValueFromString(t[3]));
    }
    if (message.indexOf("💠 Volume: ") === 0) {
      let t = ottoMessageArray[i + 1].substring(2).split("|");
      data["volume_1h"] = extractNumbersOnly(extractCodeValueFromString(t[1]));
      data["volume_6h"] = extractNumbersOnly(extractCodeValueFromString(t[2]));
      data["volume_1d"] = extractNumbersOnly(extractCodeValueFromString(t[3]));
    }
    if (message.indexOf("📊 Charts: ") === 0) {
      data["charts"] = message.substring(10);
    }
  }

  for (let i = 0; i < pirbMessageArray.length; i++) {
    let message = pirbMessageArray[i];
    if (i > 0 && pirbMessageArray[i - 1].indexOf("➖➖➖➖➖➖") >= 0) {
      data["contract_info"] = message.replaceAll("🚨", "🧰").toUpperCase();
    }
    if (message.indexOf("👥 Socials: ") === 0) {
      let t = message.substring(11);
      t = t.replace("🌐", "Website");
      t = t.replace("🐦", "Twitter");
      t = t.replace("💬", "Telegram");
      t = t.replaceAll("/a><a", "/a> | <a");
      data["socials"] = t;
    }
    if (message.indexOf("⏳ <b>Age</b>: ") === 0) {
      data["age"] = message.substring(14);
    }
  }
  console.log("ttf-message", ttfMessageArray);
  for (let i = 0; i < ttfMessageArray.length; i++) {
    let message = ttfMessageArray[i];
    if (message.indexOf("📊") >= 0 && message.indexOf("TS") === -1) {
      data["direct_links"] = message.substring(2);
    }
    if (message.indexOf("🔒 <b>LP Lock</b>:") === 0) {
      data["lp_lock"] = message.split(": ")[1];
    }
    if (message.indexOf("⛽ <b>Gas</b>: ") === 0) {
      data["gas"] = message.substring(14);
    }
    if (message.indexOf("👨‍💻 <b>Deployer</b>: ") === 0) {
      data["deployer"] = message.substring(23);
    }
    if (message.indexOf("👤 <b>Owner</b>: ") === 0) {
      data["owner"] = message.substring(16);
    }
    if (message.indexOf("💰 <b>MC:</b> ") === 0) {
      let t = message;
      let splitted = t.split("|");
      data["market_cap"] = splitted[0].split(" ")[2].replace("$", "");
      data["liq"] = {
        value: splitted[1].split(" ")[2].replace("$", ""),
        percent: splitted[1].split("(")[1].replace("%)", ""),
      };
    }
    if (message.indexOf("💲 <b>Price</b>: ") === 0) {
      data["price"] = message.substring(17).replace("$", "");
    }
    if (message.indexOf("💵 <b>Launch MC</b>: ") === 0) {
      data["launch_mc"] = {
        value: message.substring(21).split(" ")[0].replace("$", ""),
        multiplier: message
          .substring(21)
          .split(" ")[1]
          .split("x")[0]
          .substring(1),
      };
    }
    if (message.indexOf("👆 <b>ATH:</b> ") === 0) {
      data["ath"] = {
        value: message.substring(15).split(" ")[0].replace("$", ""),
        multiplier: message
          .substring(15)
          .split(" ")[1]
          .split("x")[0]
          .substring(1),
      };
    }
    if (message.indexOf("📊 <b>TS: ") === 0) {
      let t = message.substring(2).split("|");
      data["total_sale"] = t[0].split(": ")[1].replace("</b>", "");
      data["burned"] = t[1].split(": ")[1].replace("%", "");
    }
    if (message.indexOf("👩‍👧‍👦 <b>Holders: ") === 0) {
      let t = message.substring(2).split("|");
      data["holders"] = t[0].split(": ")[1].replace("</b>", "");
      data["top_10"] = t[1].split(" ").pop().replace("%", "");
    }
    if (message.indexOf("💸 <b>Airdrops:</b> ") === 0) {
      if (message.indexOf("No Airdrops.") === 0) {
        data["airdrops"] = {
          number: 0,
          percent: 0,
        };
      } else
        data["airdrops"] = {
          number: message.substring(20).replace("%", "").split(" ")[0],
          percent: message.substring(20).replace("%", "").split(" ")[5],
        };
    }
  }

  var reply_message = "🌐  <b>Build View Analytics</b>\n\n";
  if (data.token_name !== undefined) {
    reply_message = reply_message + `💲 <code>${data.token_name}</code> \n`;
  }
  if (data.token_address !== undefined) {
    reply_message = reply_message + `📌 <code>${data.token_address}</code> \n`;
  }
  reply_message = reply_message + "\n<b><u>Main information</u></b> \n";
  if (data.chain !== undefined) {
    reply_message =
      reply_message + `🔗 Chain name: <code>${data.chain}</code> \n`;
  }
  if (data.contract !== undefined) {
    reply_message = reply_message + `📃 Contract: ${data.contract} \n`;
  }
  if (data.supply !== undefined) {
    reply_message =
      reply_message + `📊 Total supply: <code>${data.supply}</code> \n`;
  }
  if (data.deployer !== undefined) {
    reply_message = reply_message + `🧑‍💻 Deployer: ${data.deployer} \n`;
  }
  if (data.owner !== undefined) {
    reply_message = reply_message + `👤 Owner: ${data.owner} \n`;
  }
  if (data.socials !== undefined) {
    reply_message =
      reply_message + `\n<b>Token Socials:</b> ${data.socials} \n`;
  }
  reply_message = reply_message + "\n<b><u>Token information</u></b> \n";
  if (
    data.renounced !== undefined &&
    data.verified !== undefined &&
    data.locked !== undefined
  ) {
    reply_message =
      reply_message +
      `⁉ Renounced : ${data.renounced.replace(
        " Renounced",
        ""
      )}\n 🚥 Verified : ${data.verified.replace(
        " Verified",
        ""
      )} \n🔓 Locked : ${data.locked.replace(" Locked", "")}`;
  }
  if (data.contract_info !== undefined)
    reply_message =
      reply_message +
      "\n" +
      data.contract_info
        .split(", ")
        .filter((value) => {
          if (
            value.indexOf("NOT RENOUNCED") >= 0 ||
            value.indexOf("LOCKED") >= 0 ||
            value.indexOf("VERIFIED") >= 0
          )
            return false;
          return true;
        })
        .sort((a, b) => {
          return hashCode(a) - hashCode(b);
        })
        .join("\n") +
      "\n";
  if (data.lp_lock !== undefined && data.direct_links !== undefined) {
    reply_message = reply_message + "\n";
    reply_message =
      reply_message +
      `<b>LP Locked Percent:</b> ${parseFormatedPercentage(
        data.lp_lock.split(", ")[0].replace("%", ""),
        2
      )}%`;
    reply_message =
      reply_message +
      `\n<b>LP Locked Period:</b> ${data.lp_lock
        .split(", ")[1]
        .replace("y", " year")
        .replace("m", " month")
        .replace("d", " day")}`;
    reply_message =
      reply_message + `\n${data.direct_links.replaceAll("|", "")}\n`;
  }
  reply_message = reply_message + "\n<b><u>Token Stats</u></b>\n";

  if (data.price !== undefined) {
    reply_message =
      reply_message +
      `📊 <b>Price:</b> $${parseFormatedPrice(data.price, 2)}\n`;
  }

  if (data.launch_mc !== undefined) {
    reply_message =
      reply_message +
      `💶 <b>Launch Marketcap</b>: $${data.launch_mc.value}(${data.launch_mc.multiplier}X)\n`;
  }
  if (data.ath !== undefined) {
    reply_message =
      reply_message +
      `🗞 <b>ATH</b>: $${data.ath.value}(${data.ath.multiplier}X)\n`;
  }
  reply_message = reply_message + "\n";

  if (data.market_cap !== undefined && data.liq !== undefined) {
    reply_message =
      reply_message +
      `💰 <b>MC</b>: $${data.market_cap} | <b>Liq</b>: $${
        data.liq.value
      }(${parseFormatedPrice(data.liq.percent, 4)}%)\n`;
  }

  reply_message =
    reply_message +
    `📝 <b>Taxes:</b> <b>Buy</b> ${parseFormatedPercentage(
      data.buy_tax
    )}% | <b>Sell</b> ${parseFormatedPercentage(
      data.sell_tax
    )}% | <b>Transfer</b> ${parseFormatedPercentage(data.xfer_tax)}% \n\n`;

  if (data.gas !== undefined) {
    reply_message =
      reply_message +
      `🚙 <b>Gas:</b> ${parseFormatedPrice(
        data.gas.split("|")[0]
      )} | ${parseFormatedPrice(data.gas.split("|")[1])} \n`;
  }
  if (data.holders !== undefined && data.top_10 !== undefined)
    reply_message =
      reply_message +
      `👩‍👩‍👧‍👧 <b>Holders:</b> ${data.holders} | 🐳 <b>Top 10: </b> ${data.top_10}\n`;

  reply_message = reply_message + "\n";

  if (
    data.price_1d !== undefined &&
    data.price_1h !== undefined &&
    data.price_5m !== undefined
  )
    reply_message =
      reply_message +
      `💸 <b>Price Change:</b> \n └  5M: ${data.price_5m}% | 1H: ${data.price_1h}% | 1D: ${data.price_1d}% \n\n`;

  if (
    data.volume_1d !== undefined &&
    data.volume_1h !== undefined &&
    data.volume_6h !== undefined
  )
    reply_message =
      reply_message +
      `💸 <b>Volume Change:</b> \n └  1H: $${data.volume_1h} | 6H: $${data.volume_6h} | 1D: $${data.volume_1d} \n\n`;

  if (data.age !== undefined) {
    reply_message =
      reply_message + `📅 <b>Age</b>: ${data.age.split(" ")[0]} \n`;
  }
  if (data.airdrops !== undefined) {
    reply_message =
      reply_message +
      `💷 <b>Airdrops</b>: ${data.airdrops.number} (${parseFormatedPercentage(
        data.airdrops.percent,
        2
      )}%) \n`;
  }

  if (data.charts !== undefined)
    reply_message = reply_message + `\n📊 <b>Charts:</b> ${data.charts} \n`;
  return reply_message;
};

const checkIfGenerating = (str) => {
  return (
    str.toLowerCase().indexOf("scanning tokens...") == -1 &&
    str.toLowerCase().indexOf("seconds...") == -1 &&
    str.toLowerCase().indexOf("generating message...") == -1 &&
    str.toLowerCase().indexOf("pirb is generating the whalemap now") == -1 &&
    str.toLowerCase().indexOf("pirb is generating the") == -1
  );
};
const GetAnswer = (command) => {
  const data = {
    x: "TweetMetrics Crypto",
    cmt: "Get Community of token",
    kol: "Get KOLs of token",
    c: "Fetch on-chain data for chart display",
    ta: "Generate Fibonacci levels and RSI on chart",
    ma: "Generate Moving Averages on the chart",
    smi: "Generate Stochastic Movement Index on the chart",
    bol: "Generate Bollinger Bands on the chart",
    ema: "Generate Exponential Moving Averages on the chart",
    h: "Analyze top 15 holders of the token",
    jeet: "Generate a JeetMap",
    tax: "Review and verify collected tax payments",
    hmp: "Generate a HoldersMap",
    whale: "Generate a WhaleMap for ETH and BSC tokens",
    e: "Generate a EarlyBuyersMap",
  };
  return data[command] || command;
};
module.exports = {
  GetAnswer,
  checkIfGenerating,
  checkMessages,
  sendAnalyzedMessage,
  sendHoldersMessage,
  debounce,
  getTokenAgePools,
  getTokenBasic,
  getTokenMainInfo,
  getTokenBalanceHolders,
  getTokenChain,
  getTokenContarct,
  getTokenSupply,
  getTokenAddress,
  getTokenName,
  getGas,
  getPNL,
  getMarketingFee,
  getTeamInfo,
  getTopList,
  getChartInfo,
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
  handleTaxCmd,
  processCmtCommand,
  processKolCommand,
};
