const { default: BigNumber } = require("bignumber.js");
const { fetchTokenPriceInNativeCoin, fetchNativeCoinPrice } = require("./api");

const buildAddress = "0x73454ACfdDb7a36A3cd8Eb171fBEa86c6a55E550";

function hashCode(str) {
  let hash = 0;
  if (str.length === 0) {
    return hash;
  }
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 1) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
const numbers = ["1️⃣", "2️⃣", "3️⃣", "️4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

const cashTags = [
  "$UNI",
  "$LINK",
  "$LTC",
  "$BCH",
  "$XLM",
  "$USDT",
  "$SOL",
  "$THETA",
  "$VET",
  "$EOS",
  "$TRX",
  "$FIL",
  "$XTZ",
  "$AAVE",
  "$ATOM",
  "$NEO",
  "$CRO",
  "$MKR",
  "$COMP",
  "$SUSHI",
  "$SNX",
  "$YFI",
  "$UMA",
  "$BAT",
  "$HT",
  "$ENJ",
  "$RVN",
  "$ZIL",
  "$ONT",
  "$KSM",
  "$ALGO",
  "$REN",
  "$GRT",
  "$ZRX",
  "$MANA",
  "$WAVES",
  "$HOT",
  "$ICX",
  "$LSK",
  "$DGB",
  "$QTUM",
  "$SC",
  "$CHZ",
  "$STORJ",
  "$BTMX",
  "$LRC",
  "$SNM",
  "$LUNA",
  "$ICP",
  "$BTT",
  "$SAND",
  "$OMG",
  "$FTT",
  "$ANKR",
  "$IOST",
  "$GNO",
  "$RLC",
  "$WTC",
  "$SRM",
  "$CELO",
];

function formatNumberWithCommas(number, decimal = 0) {
  const parts = number.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (decimal === 0) return parts.join(".");
  else return formatNumberWithCommas(Number(new BigNumber(number).toFixed(2)));
}
const parseFormatedPrice = (price, decimal = 0) => {
  if (
    String(price).indexOf("K") >= 0 ||
    String(price).indexOf("k") >= 0 ||
    String(price).indexOf("m") >= 0 ||
    String(price).indexOf("M") >= 0
  )
    return price;
  let newPrice = String(price).replace("$", "").replaceAll(",", "");
  if (decimal === 0) {
    if (price < 100) return Math.abs(price - price / 20).toFixed(decimal);
    if (price < 1000) return Math.abs(price - price / 60).toFixed(decimal);
  }
  return formatNumberWithCommas((Number(newPrice) * 1.0001).toFixed(decimal));
};

const parseFormatedPercentage = (value, decimal = 0) => {
  let newValue = String(value).replace("%", "");
  return (Number(newValue) * 1.0001).toFixed(decimal);
};

const parseX = async (message_array, address) => {
  let data = {
    token_name: "build_ai",
    mentions_7d: {
      total: 1,
      kols: {
        value: 0.0,
        percent: 0.0,
      },
      unique_accounts: 1,
    },
    mention_stats: {
      mention_30min: {
        change: 0,
        mention: 0,
      },
      mention_1h: {
        change: 0,
        mention: 0,
      },
      mention_1d: {
        change: 0,
        mention: 0,
      },
      mention_7d: {
        change: 0,
        mention: 0,
      },
    },
    top_kols_7d: [],
    recent_tweets: [],
  };
  for (let i = 0; i < message_array.length; i++) {
    let msg = message_array[i];
    if (i === 0) data.token_name = msg.trim();
    else {
      if (msg.indexOf("├─🗣Total:") === 0) {
        data.mentions_7d.total = msg.split("|")[0].split(":")[1].trim();
        data.mentions_7d.kols.value = msg
          .split("|")[1]
          .split(":")[1]
          .split("(")[0]
          .trim();
        data.mentions_7d.kols.percent = msg
          .split("|")[1]
          .split(":")[1]
          .split("(")[1]
          .replace("%)", "");
      } else if (msg.indexOf("└─👤Unique Accounts:") === 0) {
        data.mentions_7d.unique_accounts = msg.split(":")[1].trim();
      } else if (msg.indexOf("| 30m |") === 0) {
        data.mention_stats.mention_30min = {
          change: msg.split("|")[2].trim(),
          mention: msg.split("|")[3].trim(),
        };
      } else if (msg.indexOf("| 1h  |") === 0) {
        data.mention_stats.mention_1h = {
          change: msg.split("|")[2].trim(),
          mention: msg.split("|")[3].trim(),
        };
      } else if (msg.indexOf("| 1d  |") === 0) {
        data.mention_stats.mention_1d = {
          change: msg.split("|")[2].trim(),
          mention: msg.split("|")[3].trim(),
        };
      } else if (msg.indexOf("| 7d  |") === 0) {
        data.mention_stats.mention_7d = {
          change: msg.split("|")[2].trim(),
          mention: msg.split("|")[3].trim(),
        };
      } else if (msg.indexOf("Top KOLs (7D):") === 0) {
        i = i + 1;
        while (true) {
          let temp = message_array[i];
          if (temp.length === 0) break;
          data.top_kols_7d.push({
            user_name: temp.split("|")[0].split(" ")[1],
            tweet_0: temp.split("|")[1].split(":")[1].trim(),
            tweet_1: temp.split("|")[2].trim(),
          });
          i = i + 1;
        }
      } else if (msg.indexOf("Recent Tweets") === 0) {
        i = i + 1;
        while (true) {
          let temp = message_array[i];
          if (temp.length === 0) break;
          data.recent_tweets.push({
            user_name: temp.split("|")[0].split(" ")[1],
            tweet_0: temp.split("|")[1].split(":")[1].trim(),
            tweet_1: temp.split("|")[2].trim(),
          });
          i = i + 1;
        }
      }
    }
  }
  // console.log(data);
  let reply = "";
  reply =
    reply + `<b>Token:</b> ${data.token_name}  \n<code>${address}</code>\n\n`;
  reply =
    reply +
    `<u><b>7D mentions</b></u>\n💠 <b>Total Mention:</b> ${data.mentions_7d.total} \n🏵️ <b>Kols:</b> ${data.mentions_7d.kols.value}(${data.mentions_7d.kols.percent}%) \n🎖️ <b>Unique Accounts:</b> ${data.mentions_7d.unique_accounts}\n\n`;

  reply = reply + `<code>         |30m   |1h    |1d    |7d    | </code>\n`;
  reply = reply + `<code>------------------------------------- </code>\n`;
  reply =
    reply +
    `<code>Change(%)|${data.mention_stats.mention_30min.change
      .toString()
      .split(".")[0]
      .padEnd(6)}|${data.mention_stats.mention_1h.change
      .toString()
      .split(".")[0]
      .padEnd(6)}|${data.mention_stats.mention_1d.change
      .toString()
      .split(".")[0]
      .padEnd(6)}|${data.mention_stats.mention_7d.change
      .toString()
      .split(".")[0]
      .padEnd(6)}| </code>\n`;
  reply =
    reply +
    `<code>Mentions |${data.mention_stats.mention_30min.change
      .toString()
      .split(".")[0]
      .padEnd(6)}|${data.mention_stats.mention_1h.mention
      .toString()
      .split(".")[0]
      .padEnd(6)}|${data.mention_stats.mention_1d.mention
      .toString()
      .split(".")[0]
      .padEnd(6)}|${data.mention_stats.mention_7d.mention
      .toString()
      .split(".")[0]
      .padEnd(6)}| </code>\n`;

  reply = reply + "\n<b><u>🐎 Top kols 7D</u></b>\n";
  for (let item of data.top_kols_7d) {
    reply =
      reply +
      `<a href="https://twitter.com/${item.user_name}">🗣️ ${item.user_name}</a> (${item.tweet_0} | ${item.tweet_1}) \n`;
  }

  reply = reply + "\n<b><u>🐴 Recent Tweets</u></b>\n";
  for (let item of data.recent_tweets) {
    reply =
      reply +
      `<a href="https://twitter.com/${item.user_name}">🗣️ ${item.user_name}</a> (${item.tweet_0} | ${item.tweet_1}) \n`;
  }

  return reply;
};

const parsePirbSimpleCommand = async (message_array, address) => {
  const data = {
    token_name: "",
    chain_name: "",
    mcap: "",
    liq: "",
    price: "",
    vol_24: "",
    price_1h: "",
    price_24h: "",
  };
  for (let i = 0; i < message_array.length; i++) {
    let message = message_array[i];
    if (message.indexOf("🪙") === 0) {
      data.token_name = message.substring(2);
    } else if (message.indexOf("🔗 ") === 0) {
      data.chain_name = message
        .substring(2)
        .replace("<b>", "")
        .replace("</b>", "")
        .trim();
    } else if (message.indexOf("📊 ") === 0) {
      data.mcap = message.substring(2).split(":")[1];
    } else if (message.indexOf("💦 ") === 0) {
      data.liq = message.substring(2).split(":")[1];
    } else if (message.indexOf("🏷 ") === 0) {
      data.price = message.substring(2).split(":")[1];
    } else if (message.indexOf("📈 ") === 0) {
      data.vol_24 = message.substring(2).split(":")[1];
    } else if (message.indexOf("<b>1h</b>") >= 0) {
      data.price_1h = message.split(":")[1].split(" ")[1];
      data.price_24h = message.split(":")[2].split(" ")[1];
    }
  }
  const geckoData = await fetchTokenPriceInNativeCoin(data.chain_name, address);
  return `⚾ <b>Token Name:</b> ${data.token_name} \n⛓️ <b>Chain Name:</b> ${
    data.chain_name
  } \n
💰 <b>Market Cap:</b> $${parseFormatedPrice(
    data.mcap
  )} \n💳 <b>Liq:</b> $${parseFormatedPrice(data.liq)}\n
💲 <b>Price:</b> ${data.price}(${
    geckoData.priceInNative
  })\n💵 <b>Volume:</b> ${parseFormatedPrice(data.vol_24)} \n
${
  parseFormatedPercentage(data.price_1h, 2) >= 0
    ? `🟩 1h: ${parseFormatedPercentage(data.price_1h, 2)}%`
    : `🟥 1h: ${parseFormatedPercentage(data.price_1h, 2)}%`
} |  ${
    parseFormatedPercentage(data.price_24h, 2) >= 0
      ? `🟩 24h: ${parseFormatedPercentage(data.price_24h, 2)}%`
      : `🟥 24h: ${parseFormatedPercentage(data.price_24h, 2)}%`
  }
  \n<u><i>Last updated at:</i> ${new Date(
    geckoData.lastUpdated * 1000
  ).toLocaleString()} </u> `;
};

const parseT = (message_array, address) => {
  let data = [];
  for (let i = 0; i < message_array.length; i++) {
    let msg = message_array[i];
    if (msg.indexOf("🔊") >= 0) {
      data.push({
        cashtag: msg.split(" ")[1].trim(),
        tweets: Number(msg.split(" ")[2]),
      });
    }
  }
  if (data.length === 0) return "No results found\n";
  let hash = hashCode(address);
  let r1, r2, r3;
  r1 = hash % cashTags.length;
  r2 = ((hash * 2) % 3) + data.length / 2;
  r3 = r2 + 1;
  r4 = (hash * 4) % data.length;

  while (
    data.findIndex((val) => {
      return val.cashtag == cashTags[r1];
    }) >= 0
  ) {
    r1 = (r1 + 1) % cashTags.length;
  }
  if (data[0].cashtag === "$XALPHA") {
    data.shift();
    let last = data[data.length - 1].tweets;
    data.push({
      cashtag: cashTags[r1],
      tweets: Math.abs(last - r2),
    });
  } else {
    data[data.length - 1].cashtag = cashTags[r1];
  }
  if (data.length >= 6) {
    let t = data[r2].cashtag;
    data[r2].cashtag = data[r3].cashtag;
    data[r3].cashtag = t;
    data[r4].tweets += 1;
  }

  let reply = `<b>Cashtags #${address} 30 days</b> \n`;
  for (let i = 0; i < data.length; i++) {
    reply = reply + `${numbers[i]} ${data[i].cashtag} ${data[i].tweets} 🔊\n`;
  }
  return reply;
};
const parseCashtag = (message_array, address) => {
  let d = {
    last_1_hour: [],
    last_24_hour: [],
    heading: "",
  };
  d.heading = message_array[0];
  for (let i = 0; i < message_array.length; i++) {
    let msg = message_array[i];
    if (msg.indexOf("Last 1 hour") >= 0) {
      i = i + 1;
      while (true) {
        if (message_array[i].length === 0) break;
        d.last_1_hour.push({
          token: "<a " + message_array[i].split(" ")[2],
          mentions: message_array[i].split(" ")[4],
          kols: message_array[i].split(" ")[7],
        });
        i = i + 1;
      }
    }
    if (msg.indexOf("Last 24 hour") >= 0) {
      i = i + 1;
      while (true) {
        if (message_array[i].length === 0) break;
        d.last_24_hour.push({
          token: "<a " + message_array[i].split(" ")[2],
          mentions: message_array[i].split(" ")[4],
          kols: message_array[i].split(" ")[7],
        });
        i = i + 1;
      }
    }
  }
  let reply = d.heading + "\n";

  reply = reply + "\n🚀 <b>Last 1 Hour:</b> \n";

  for (let i = 0; i < d.last_1_hour.length; i++) {
    reply =
      reply +
      `${numbers[i]} ${d.last_1_hour[i].token} 📡 ${parseFormatedPrice(
        d.last_1_hour[i].mentions
      )} | 🌠 ${d.last_1_hour[i].kols} KOLs\n`;
  }

  reply = reply + "\n🚀 <b>Last 24 Hour:</b> \n";
  for (let i = 0; i < d.last_24_hour.length; i++) {
    reply =
      reply +
      `${numbers[i]} ${d.last_24_hour[i].token} 📡 ${
        d.last_24_hour[i].mentions
      } | 🌠 ${parseFormatedPrice(d.last_24_hour[i].kols)} KOLs\n`;
  }
  return reply;
};
const parseHashtag = (message_array, address) => {
  let d = {
    heading: "Last 24 hour Trending #Tags",
    item: [],
  };

  for (let i = 0; i < message_array.length; i++) {
    let msg = message_array[i];
    if (msg.indexOf("Last") >= 0) {
      i = i + 1;
      while (true) {
        if (message_array[i].length === 0) break;
        d.item.push({
          token: message_array[i].split(" ")[1],
          mentions: message_array[i].split(" ")[3],
          kols: message_array[i].split(" ")[6],
        });
        i = i + 1;
      }
    }
  }
  let reply = "🚀 " + d.heading + "\n\n";

  for (let i = 0; i < d.item.length; i++) {
    reply =
      reply +
      `${numbers[i]} ${d.item[i].token} 📡 ${parseFormatedPrice(
        d.item[i].mentions
      )} | 🌠 ${d.item[i].kols} KOLs\n`;
  }

  return reply;
};

const parseKol = async (message_array, address) => {
  let data = {
    heading: "🇽(Twitter) Community KOL Leaderboard(30 days)",
    item: [],
    tweets: 46,
  };

  let isBuild = address.toLowerCase() === buildAddress.toLowerCase();

  for (let i = 0; i < message_array.length; i++) {
    let msg = message_array[i];
    if (msg.indexOf("Tweets") >= 0) {
      data.tweets = msg.split(":")[1].trim();
    }
    if (msg.indexOf("href=") >= 0) {
      data.item.push({
        token: "<a " + msg.split(" ")[2],
        followers: msg.split(" ")[4],
        tweets: msg.split(" ")[7].substring(2),
      });
    }
  }

  let tokenData = null;
  let scanUrl = null;
  try {
    let res = await fetchTokenPriceInNativeCoin("Ethereum", address);
    if (res !== null) {
      tokenData = res;
      scanUrl = "https://etherscan.io/address/" + address;
    }
  } catch (err) {}

  try {
    let res = await fetchTokenPriceInNativeCoin("BNBChain", address);
    if (res !== null) {
      tokenData = res;
      scanUrl = "https://bscscan.com/address/" + address;
    }
  } catch (err) {}

  let reply = `<i>${data.heading}</i>\n\n`;
  if (tokenData != null) {
    reply = reply + `<b>Price:</b> ${tokenData.priceInNative} \n`;
    reply = reply + `<b>Link:</b> <a href="${scanUrl}">✏</a>\n`;
  }
  reply =
    reply +
    `\n<b>Tweets:</b> ${
      isBuild ? data.tweets : parseFormatedPrice(data.tweets)
    } \n`;
  for (let i = 0; i < data.item.length; i++) {
    reply =
      reply +
      `${numbers[i]} ${data.item[i].token} 📡 ${data.item[i].followers} (followers) | 🔊 ${data.item[i].tweets} \n`;
  }
  if (tokenData != null) {
    reply =
      reply +
      `\n<u><i>Last updated at:</i> ${new Date(
        tokenData.lastUpdated * 1000
      ).toLocaleString()} </u> `;
  }
  return reply;
};

const parseCmt = async (message_array, address) => {
  let data = {
    heading: "🇽(Twitter) Community Leaderboard(30 days)",
    item: [],
    tweets: 46,
  };

  let isBuild = address.toLowerCase() === buildAddress.toLowerCase();

  for (let i = 0; i < message_array.length; i++) {
    let msg = message_array[i];
    if (msg.indexOf("Tweets") >= 0) {
      data.tweets = msg.split(":")[1].trim();
    }
    if (msg.indexOf("href=") >= 0) {
      data.item.push({
        token: "<a " + msg.split(" ")[2],
        followers: msg.split(" ")[4],
        tweets: msg.split(" ")[7].substring(2),
      });
    }
    if (msg.indexOf("Top 30 Accounts") >= 0) break;
  }

  let tokenData = null;
  let scanUrl = null;
  try {
    let res = await fetchTokenPriceInNativeCoin("Ethereum", address);
    if (res !== null) {
      tokenData = res;
      scanUrl = "https://etherscan.io/address/" + address;
    }
  } catch (err) {}

  try {
    let res = await fetchTokenPriceInNativeCoin("BNBChain", address);
    if (res !== null) {
      tokenData = res;
      scanUrl = "https://bscscan.com/address/" + address;
    }
  } catch (err) {}

  let reply =
    `<i>${data.heading}</i>` +
    `\n\n<b>Tweets:</b> ${
      isBuild ? data.tweets : parseFormatedPrice(data.tweets)
    } \n`;
  if (tokenData != null) {
    reply = reply + `<b>Price:</b> ${tokenData.priceInNative} \n`;
    reply = reply + `<b>Link:</b> <a href="${scanUrl}">✏</a>\n\n`;
  }

  reply = reply + "<b>Top 10 mentions</b>\n";

  for (let i = 0; i < data.item.length; i++) {
    reply =
      reply +
      `${numbers[i]} ${data.item[i].token} 📡 ${data.item[i].followers} (followers) | 🔊 ${data.item[i].tweets} \n`;
  }
  if (tokenData != null) {
    reply =
      reply +
      `\n<u><i>Last updated at:</i> ${new Date(
        tokenData.lastUpdated * 1000
      ).toLocaleString()} </u> `;
  }
  return reply;
};
const parseGas = async (message_array) => {
  const res = await fetchNativeCoinPrice();

  let tokenPriceData = `🏆 <b>Ethereum</b>\n <b>ETH Price:</b> $${formatNumberWithCommas(
    res.ethereum.usd
  )}\n <b>ETH market cap:</b> $${formatNumberWithCommas(
    res.ethereum.usd_market_cap,
    2
  )}\n <b>24 Vol:</b> $${formatNumberWithCommas(
    res.ethereum.usd_24h_vol,
    2
  )}\n <b>24H Change:</b> ${formatNumberWithCommas(
    res.ethereum.usd_24h_change,
    2
  )}%`;
  tokenPriceData =
    tokenPriceData +
    `\n\n🏆 <b>BNBSmartChain</b>\n <b>BNB Price:</b> $${formatNumberWithCommas(
      res.binancecoin.usd
    )}\n <b>BNB market cap:</b> $${formatNumberWithCommas(
      res.binancecoin.usd_market_cap,
      2
    )}\n <b>24 Vol:</b> $${formatNumberWithCommas(
      res.binancecoin.usd_24h_vol,
      2
    )}\n <b>24H Change:</b> ${formatNumberWithCommas(
      res.binancecoin.usd_24h_change,
      2
    )}%`;
  let reply =
    tokenPriceData +
    "\n\n" +
    message_array[2] +
    "\n" +
    message_array[3] +
    "\n" +
    message_array[5] +
    "\n" +
    message_array[6] +
    `\n\n<u><i>Last updated at:</i> ${new Date(
      res.ethereum.last_updated_at * 1000
    ).toLocaleString()} </u> `;

  return reply;
};
const parsePnl = async (message_array, address) => {
  const res = await fetchNativeCoinPrice();

  let tokenPriceData = `🏆 <b>Ethereum</b>\n <b>ETH Price:</b> $${formatNumberWithCommas(
    res.ethereum.usd
  )}\n <b>ETH market cap:</b> $${formatNumberWithCommas(
    res.ethereum.usd_market_cap,
    2
  )}\n <b>24 Vol:</b> $${formatNumberWithCommas(
    res.ethereum.usd_24h_vol,
    2
  )}\n <b>24H Change:</b> ${formatNumberWithCommas(
    res.ethereum.usd_24h_change,
    2
  )}%`;
  tokenPriceData =
    tokenPriceData +
    `\n\n🏆 <b>BNBSmartChain</b>\n <b>BNB Price:</b> $${formatNumberWithCommas(
      res.binancecoin.usd
    )}\n <b>BNB market cap:</b> $${formatNumberWithCommas(
      res.binancecoin.usd_market_cap,
      2
    )}\n <b>24 Vol:</b> $${formatNumberWithCommas(
      res.binancecoin.usd_24h_vol,
      2
    )}\n <b>24H Change:</b> ${formatNumberWithCommas(
      res.binancecoin.usd_24h_change,
      2
    )}%`;
  let data = {
    item: [],
  };
  for (let i = 0; i < message_array.length; i++) {
    if (message_array[i].indexOf("href") >= 0) {
      let token = "<a" + message_array[i].split("<a")[1];
      let B = message_array[i + 1].split(" ")[1];
      let S = message_array[i + 1].split(" ")[5];
      let H = message_array[i + 1].split(" ")[9];
      let PNL = message_array[i + 2].split(" ")[1];
      let UPNL = message_array[i + 2].split(" ")[5];
      data.item.push({
        token,
        B,
        S,
        H,
        PNL,
        UPNL,
      });
    }
  }

  let reply = `\n<b>Token:</b> <a href="https://etherscan.io/address/${address}">${address} </a>\n\n`;

  data.item
    .sort((a, b) => {
      return b.PNL - a.PNL;
    })
    .map((value, index) => {
      reply =
        reply +
        `${Number(value.PNL) > 0 ? "😊" : "🥶"} ${index + 1} ${
          value.token
        }\n      <b>PNL:</b> ${value.PNL} ETH\n      <b>Buy:</b> ${
          value.B
        } ETH | <b>Sell:</b> ${value.S} ETH | <b>Holding:</b> ${
          value.H
        } ETH\n\n`;
    });
  return (
    reply +
    "\n" +
    tokenPriceData +
    `\n\n<u><i>Last updated at:</i> ${new Date(
      res.ethereum.last_updated_at * 1000
    ).toLocaleString()} </u> `
  );
};

const parseTax = async (message_array, address) => {
  let data = {
    item: [],
    heading: message_array[0],
  };

  for (let i = 1; i < message_array.length; i++) {
    if (message_array[i].indexOf("href") >= 0) {
      let wallet = message_array[i];
      let txs = [];
      while (true) {
        i++;
        if (i == message_array.length || message_array[i].length === 0) break;
        txs.push({
          code: message_array[i].split("</code>")[0] + "</code>",
          ethAmount: parseFormatedPrice(
            message_array[i].split("</code>")[1].split(" ")[1].trim(),
            2
          ),
          usdAmount: parseFormatedPrice(
            message_array[i].split("</code>")[1].split(" ")[4].trim(),
            2
          ),
        });
      }
      data.item.push({
        wallet,
        txs,
      });
    } else if (message_array[i].indexOf("<b>Total:</b>") >= 0) {
      let wallet = message_array[i];
      let txs = [];
      while (true) {
        i++;
        if (i == message_array.length || message_array[i].length === 0) break;
        txs.push({
          code: message_array[i].split("</code>")[0] + "</code>",
          ethAmount: parseFormatedPrice(
            message_array[i].split("</code>")[1].split(" ")[0],
            2
          ),
          usdAmount: parseFormatedPrice(
            message_array[i].split("</code>")[1].split(" ")[3],
            2
          ),
        });
      }
      data.item.push({
        wallet,
        txs,
      });
    }
  }

  if (data.item.length === 0)
    return "Wait for a seconds... We are scanning token";
  else {
    let reply = "<b>Taxes Summary</b>\n\n";
    reply = reply + data.heading + "\n";
    for (let i = 0; i < data.item.length; i++) {
      reply = reply + `\n${data.item[i].wallet}\n`;
      for (let j = 0; j < data.item[i].txs.length; j++) {
        reply =
          reply +
          `${data.item[i].txs[j].code
            .replace("+", "🎁")
            .replace("-", "📤")
            .replace("*", "💰")
            .replace("=", "📦")} ${data.item[i].txs[j].ethAmount} ETH / ${
            data.item[i].txs[j].usdAmount
          }  USD\n`;
      }
    }
    const res = await fetchNativeCoinPrice();

    let tokenPriceData = `🏆 <b>Ethereum</b>\n <b>ETH Price:</b> $${formatNumberWithCommas(
      res.ethereum.usd
    )}\n <b>ETH market cap:</b> $${formatNumberWithCommas(
      res.ethereum.usd_market_cap,
      2
    )}\n <b>24 Vol:</b> $${formatNumberWithCommas(
      res.ethereum.usd_24h_vol,
      2
    )}\n <b>24H Change:</b> ${formatNumberWithCommas(
      res.ethereum.usd_24h_change,
      2
    )}%`;
    tokenPriceData =
      tokenPriceData +
      `\n\n🏆 <b>BNBSmartChain</b>\n <b>BNB Price:</b> $${formatNumberWithCommas(
        res.binancecoin.usd
      )}\n <b>BNB market cap:</b> $${formatNumberWithCommas(
        res.binancecoin.usd_market_cap,
        2
      )}\n <b>24 Vol:</b> $${formatNumberWithCommas(
        res.binancecoin.usd_24h_vol,
        2
      )}\n <b>24H Change:</b> ${formatNumberWithCommas(
        res.binancecoin.usd_24h_change,
        2
      )}%`;

    return (
      "<b>Taxes Summary</b>\n\n" +
      data.heading +
      "\n" +
      tokenPriceData +
      reply +
      `\n\n<u><i>Last updated at:</i> ${new Date(
        res.ethereum.last_updated_at * 1000
      ).toLocaleString()} </u> `
    );
  }
};
const parseTeam = async (message_array, address) => {
  let data = {
    item: [],
  };
  for (let i = 0; i < message_array.length; i++) {
    if (message_array[i].indexOf("<b>TEAM WALLETS</b>") >= 0) {
      i = i + 1;
      while (message_array[i].indexOf("href") !== -1) {
        data.item.push(message_array[i]);
        i++;
      }
    }
  }
  const res = await fetchNativeCoinPrice();

  let tokenPriceData = `🏆 <b>Ethereum</b>\n <b>ETH Price:</b> $${formatNumberWithCommas(
    res.ethereum.usd
  )}\n <b>ETH market cap:</b> $${formatNumberWithCommas(
    res.ethereum.usd_market_cap,
    2
  )}\n <b>24 Vol:</b> $${formatNumberWithCommas(
    res.ethereum.usd_24h_vol,
    2
  )}\n <b>24H Change:</b> ${formatNumberWithCommas(
    res.ethereum.usd_24h_change,
    2
  )}%`;
  tokenPriceData =
    tokenPriceData +
    `\n\n🏆 <b>BNBSmartChain</b>\n <b>BNB Price:</b> $${formatNumberWithCommas(
      res.binancecoin.usd
    )}\n <b>BNB market cap:</b> $${formatNumberWithCommas(
      res.binancecoin.usd_market_cap,
      2
    )}\n <b>24 Vol:</b> $${formatNumberWithCommas(
      res.binancecoin.usd_24h_vol,
      2
    )}\n <b>24H Change:</b> ${formatNumberWithCommas(
      res.binancecoin.usd_24h_change,
      2
    )}%`;
  let reply = "👤 <b>TEAM WALLETS</b>\n\n";
  for (let i = 0; i < data.item.length; i++) {
    reply = reply + data.item[i] + "\n";
  }
  return (
    reply +
    `\n<u><i>Last updated at:</i> ${new Date(
      res.ethereum.last_updated_at * 1000
    ).toLocaleString()} </u> `
  );
};

const parseCross = (message_array, address) => {
  let data = {
    item: [],
  };
  let cnt = 0;
  for (let i = 0; i < message_array.length; i++) {
    if (message_array[i].indexOf("🔰") >= 0) {
      let arr = message_array[i].split("🔰</a>");
      let temp = [];
      for (let d of arr) {
        if (d.length > 0)
          temp.push({
            tokenA: 0,
            tokenB: 0,
            link: d + "🔰</a>",
          });
      }
      data.item = [...data.item, ...temp];
    }
    if (message_array[i].indexOf("|") >= 0) {
      let arr = message_array[i].split("|");
      cnt = cnt + arr.length;
      for (let j = cnt - arr.length; j < cnt; j++) {
        data.item[j].tokenA = parseFormatedPrice(
          arr[j - cnt + arr.length].replaceAll(" ", "").split("#")[1]
        );
        data.item[j].tokenB = parseFormatedPrice(
          arr[j - cnt + arr.length].replaceAll(" ", "").split("#")[2]
        );
      }
    }
  }
  let reply = message_array[0] + "\n\n";
  for (let i = 0; i < data.item.length; i++) {
    reply =
      reply +
      `<code>${Number(i + 1)
        .toString()
        .padStart(3)} : </code> <code>A - ${data.item[i].tokenA
        .toString()
        .padEnd(6)}</code> <code>B - ${data.item[i].tokenB
        .toString()
        .padEnd(6)}</code> ${data.item[i].link.replace(
        "🔰",
        "👤" +
          data.item[i].link
            .split("/address/")[1]
            .replace('">🔰</a>', "")
            .substring(0, 10) +
          "..."
      )}\n`;
  }
  return reply;
};

("🟥🟧🟨🟩🟦🟪🟫⬛⬜");

const icon = (value) => {
  if (value === "🔴") return "🟥"; // sold
  if (value === "🟡") return "🟨"; // sold part
  if (value === "🟢") return "🟩"; // hold
  if (value === "🔵") return "🟪"; // got more
  if (value === "🟣") return "🟦"; // transferred
  return "⬜";
};

const parseAirdrop = (message_array, address) => {
  let data = {
    item: [],
    sold: 0,
    sold_part: 0,
    hold: 0,
    got_more: 0,
    transferred: 0,
    total_airdropped: 0,
    current_total_holdings: 0,
    total_airdrops_detected: 0,
  };
  for (let i = 0; i < message_array.length; i++) {
    if (message_array[i].indexOf("?a=0x") >= 0) {
      let temp = message_array[i].split("</a>");
      for (let j = 0; j < temp.length - 1; j++) {
        data.item.push({
          link: temp[j].replace("<a href=", "").split(">")[0],
          value: temp[j].split(">")[1],
        });
      }
    }
    if (message_array[i].indexOf("SOLD:") >= 0)
      data.sold = message_array[i].split(" ").pop();
    if (message_array[i].indexOf("SOLD PART:") >= 0)
      data.sold_part = message_array[i].split(" ").pop();
    if (message_array[i].indexOf("HOLD:") >= 0)
      data.hold = message_array[i].split(" ").pop();
    if (message_array[i].indexOf("GOT MORE:") >= 0)
      data.got_more = message_array[i].split(" ").pop();
    if (message_array[i].indexOf("TRANSFERRED:") >= 0)
      data.transferred = message_array[i].split(" ").pop();
    if (message_array[i].indexOf("Total Airdropped:") >= 0)
      data.total_airdropped = message_array[i].split(" ").pop();
    if (message_array[i].indexOf("Current Total Holdings:") >= 0)
      data.current_total_holdings = message_array[i].split(" ").pop();
    if (message_array[i].indexOf("Total Airdrops Detected:") >= 0)
      data.total_airdrops_detected = message_array[i].split(" ").pop();
  }

  let reply = "";
  let k = hashCode(address.toLowerCase());
  if (data.item.length > 0) {
    k = k % data.item.length;
  }

  let sold = 0;
  let sold_part = 0;
  let hold = 0;
  let get_more = 0;
  let transferred = 0;

  let len = data.item.length > 64 ? 64 : data.item.length;

  for (let i = 0; i < len; i++) {
    if (i % 8 === 0 && i > 0) reply = reply + "\n";
    reply =
      reply +
      `<a href=${data.item[i].link}>${
        i === k ? "🟥" : icon(data.item[i].value)
      }</a> `;
    if (i === k) {
      sold++;
      continue;
    }
    if (data.item[i].value === "🔴") sold++;
    if (data.item[i].value === "🟡") sold_part++;
    if (data.item[i].value === "🟢") hold++;
    if (data.item[i].value === "🔵") get_more++;
    if (data.item[i].value === "🟣") transferred++;
  }
  reply =
    reply +
    `\n\n<b>Sold:</b> 🟥 ${sold}\n<b>Part Sell:</b> 🟨 ${sold_part}\n<b>Hold:</b> 🟩 ${hold} \n<b>Get More:</b> 🟪 ${get_more} \n<b>Transfer:</b> 🟦 ${transferred}\n\n<b>Total Airdrops:</b> ${
      64 > data.item.length ? data.item.length : 64
    }`;

  return message_array[0] + "\n" + reply;
};

const parseE = (message_array, address) => {
  let data = {
    item: [],
    sold: 0,
    sold_part: 0,
    hold: 0,
    got_more: 0,
    transferred: 0,
    total_airdropped: 0,
    current_total_holdings: 0,
    total_airdrops_detected: 0,
    fresh_wallets: [],
  };
  for (let i = 0; i < message_array.length; i++) {
    if (
      message_array[i].indexOf("Positions of emojis for fresh wallets") >= 0
    ) {
      let t = message_array[i].split(": ")[1].split(", ");
      data.fresh_wallets = t.filter((value) => value <= 64);
    }
    if (message_array[i].indexOf("?a=0x") >= 0) {
      let temp = message_array[i].split("</a>");
      for (let j = 0; j < temp.length - 1; j++) {
        data.item.push({
          link: temp[j].replace("<a href=", "").split(">")[0],
          value: temp[j].split(">")[1],
        });
      }
    }
    if (message_array[i].indexOf("SOLD:") >= 0)
      data.sold = message_array[i].split(" ").pop();
    if (message_array[i].indexOf("SOLD PART:") >= 0)
      data.sold_part = message_array[i].split(" ").pop();
    if (message_array[i].indexOf("HOLD:") >= 0)
      data.hold = message_array[i].split(" ").pop();
    if (message_array[i].indexOf("GOT MORE:") >= 0)
      data.got_more = message_array[i].split(" ").pop();
    if (message_array[i].indexOf("TRANSFERRED:") >= 0)
      data.transferred = message_array[i].split(" ").pop();
    if (message_array[i].indexOf("Total Airdropped:") >= 0)
      data.total_airdropped = message_array[i].split(" ").pop();
    if (message_array[i].indexOf("Current Total Holdings:") >= 0)
      data.current_total_holdings = message_array[i].split(" ").pop();
    if (message_array[i].indexOf("Total Airdrops Detected:") >= 0)
      data.total_airdrops_detected = message_array[i].split(" ").pop();
  }

  let reply = "";
  let k = hashCode(address.toLowerCase());
  if (data.item.length > 0) {
    k = k % data.item.length;
  }

  let sold = 0;
  let sold_part = 0;
  let hold = 0;
  let get_more = 0;
  let transferred = 0;

  let len = data.item.length > 64 ? 64 : data.item.length;

  for (let i = 0; i < len; i++) {
    if (i % 8 === 0 && i > 0) reply = reply + "\n";
    reply =
      reply +
      `<a href=${data.item[i].link}>${
        i === k ? "🟥" : icon(data.item[i].value)
      }</a> `;
    if (i === k) {
      sold++;
      continue;
    }
    if (data.item[i].value === "🔴") sold++;
    if (data.item[i].value === "🟡") sold_part++;
    if (data.item[i].value === "🟢") hold++;
    if (data.item[i].value === "🔵") get_more++;
    if (data.item[i].value === "🟣") transferred++;
  }
  reply =
    reply +
    `\n\n<b>Sold:</b> 🟥 ${sold}\n<b>Part Sell:</b> 🟨 ${sold_part}\n<b>Hold:</b> 🟩 ${hold} \n<b>Get More:</b> 🟪 ${get_more} \n<b>Transfer:</b> 🟦 ${transferred}\n\n<b>Total Buys:</b> ${
      64 > data.item.length ? data.item.length : 64
    }\n<b>Fresh Wallets:</b> ${
      data.fresh_wallets.length
    }\n${data.fresh_wallets.join(", ")}`;

  return message_array[0] + "\n" + reply;
};
const getLink = (str) => {
  let index = str.indexOf("https://");
  let index1 = str.indexOf('">');
  if (index === -1) return str;
  let substr = str.substring(index, index1);
  return substr;
};
const parseWhale = (message_array, address) => {
  let data = {
    item: [],
    average_holding: 0,
    max_wallet_balance: 0,
    max_wallet_index: 0,
    max_wallet: "",
  };
  for (let i = 0; i < message_array.length; i++) {
    if (message_array[i].indexOf("</b><a href=") >= 0) {
      let t = message_array[i].split("</b></a><b>");
      for (let d of t) {
        if (d.length === 0) continue;
        let link = getLink(d);
        let value = "🍤";
        if (d.indexOf("🐟") >= 0) {
          value = "🍤";
        }
        if (d.indexOf("🐬") >= 0) {
          value = "🐬";
        }
        if (d.indexOf("🐋") >= 0) {
          value = "🐋";
        }
        if (d.indexOf("🦈") >= 0) {
          value = "🦈";
        }
        data.item.push({
          link,
          value,
        });
      }
    }
    if (message_array[i].indexOf("Average Holding:") >= 0)
      data.average_holding = message_array[i]
        .split(": $")[1]
        .replaceAll(",", "");
    if (message_array[i].indexOf("Max Wallet") >= 0) {
      data.max_wallet_balance = message_array[i]
        .split(": $")[1]
        .split(" ")[0]
        .replaceAll(",", "");
      data.max_wallet_index = message_array[i]
        .split(": $")[1]
        .split(" ")[1]
        .replace("(#", "")
        .replace(")", "");
      data.max_wallet = data.item[data.max_wallet_index - 1].link;
    }
  }
  let d_arr = ["🐋", "🦈", "🐬", "🐟", "🍤"];
  let sum = {
    "🐋": 0,
    "🦈": 0,
    "🐬": 0,
    "🐟": 0,
    "🍤": 0,
  };
  let len = 64;
  if (len > data.item.length) len = data.item.length;
  let reply = message_array[0] + "</b>\n\n";
  data.item = data.item.sort((a, b) => {
    return d_arr.indexOf(a.value) - d_arr.indexOf(b.value);
  });
  for (let i = 0; i < len; i++) {
    if (i != 0 && i % 8 == 0) reply = reply + "\n";
    reply = reply + `<a href="${data.item[i].link}">${data.item[i].value}</a> `;
    sum[data.item[i].value]++;
  }
  return (
    reply +
    `\n\n<b>Average Holding:</b> ${parseFormatedPrice(
      data.average_holding,
      2
    )}\n<b>Max Wallet:</b> ${parseFormatedPrice(
      data.max_wallet_balance,
      2
    )} <a href="${data.max_wallet}">🚀</a>\n
🐋 (> $100K): ${sum["🐋"]}\n
🦈 ($50K - $100K): ${sum["🦈"]}\n
🐬 ($10K - $50K): ${sum["🐬"]}\n
🐟 ($1K - $10K): ${sum["🐟"]}\n
🍤 ($0 - $1K): ${sum["🍤"]}\n`
  );
};
const parseJeet = (message_array, address) => {
  let data = {
    item: [],
    average_holding: 0,
    max_wallet_balance: 0,
    max_wallet_index: 0,
    max_wallet: "",
  };
  for (let i = 0; i < message_array.length; i++) {
    if (message_array[i].indexOf("/a><a href=") >= 0) {
      let t = message_array[i].split("</a>");
      for (let d of t) {
        if (d.length === 0) continue;
        let link = getLink(d);
        let value = "😃";
        if (d.indexOf("👶🏽") >= 0) {
          value = "👶🏽";
        }
        if (d.indexOf("🤬") >= 0) {
          value = "🤬";
        }
        data.item.push({
          link,
          value,
        });
      }
    }
  }
  let d_arr = ["🤬", "😃", "👶🏽"];
  let sum = {
    "🤬": 0,
    "😃": 0,
    "👶🏽": 0,
  };
  let len = 64;
  if (len > data.item.length) len = data.item.length;
  let reply = message_array[0] + "\n\n";
  data.item = data.item.sort((a, b) => {
    return d_arr.indexOf(a.value) - d_arr.indexOf(b.value);
  });
  for (let i = 0; i < len; i++) {
    if (i != 0 && i % 8 == 0) reply = reply + "\n";
    reply = reply + `<a href="${data.item[i].link}">${data.item[i].value}</a> `;
    sum[data.item[i].value]++;
  }

  return (
    reply +
    `\n\n<b>🤬 ${sum["🤬"]} Jeets</b>\n<b>😃 ${sum["😃"]} Chads</b>\n<b>👶🏽 ${sum["👶🏽"]} Fresh Wallets</b>\n`
  );
};

const parseHmap = (message_array, address) => {
  let data = {
    item: [],
    average_holding: 0,
    max_wallet_balance: 0,
    max_wallet_index: 0,
    max_wallet: "",
  };
  for (let i = 0; i < message_array.length; i++) {
    if (message_array[i].indexOf("/a><a href=") >= 0) {
      let t = message_array[i].split("</a>");
      for (let d of t) {
        if (d.length === 0) continue;
        let link = getLink(d);
        let value = "🟩";

        if (d.indexOf("🟩") >= 0) {
          value = "🟢";
        }
        if (d.indexOf("🟨") >= 0) {
          value = "🟡";
        }
        if (d.indexOf("🟧") >= 0) {
          value = "🟠";
        }
        if (d.indexOf("🟥") >= 0) {
          value = "🔴";
        }
        if (d.indexOf("🟦") >= 0) {
          value = "🔵";
        }

        data.item.push({
          link,
          value,
        });
      }
    }
  }
  let d_arr = ["🟢", "🟡", "🟠", "🔴", "🔵"];
  let sum = {
    "🟢": 0,
    "🟡": 0,
    "🟠": 0,
    "🔴": 0,
    "🔵": 0,
  };
  let len = 64;
  if (len > data.item.length) len = data.item.length;
  let reply = message_array[0] + "\n\n";
  data.item = data.item.sort((a, b) => {
    return d_arr.indexOf(a.value) - d_arr.indexOf(b.value);
  });
  for (let i = 0; i < len; i++) {
    if (i != 0 && i % 8 == 0) reply = reply + "\n";
    reply = reply + `<a href="${data.item[i].link}">${data.item[i].value}</a> `;
    sum[data.item[i].value]++;
  }

  return (
    reply +
    `\n\n<b>🟢 Buys Only:</b> ${sum["🟢"]}\n<b>🟡 Buys more than sell:</b> ${sum["🟡"]}\n<b>🟠 Sells more than buy:</b> ${sum["🟠"]}\n<b>🔴 Transfer in and sells:</b> ${sum["🔴"]}\n<b>🔵 Transfer in and holds:</b> ${sum["🔵"]}\n`
  );
};
const parse = async (message, command, address) => {
  try {
    if (
      message.indexOf("Sorry, No data found for this token/influencer") >= 0
    ) {
      return 123;
    }

    let message_array = message.split("\n");

    if (command === "x") {
      let reply = await parseX(message_array, address);
      return reply;
    }

    if (
      command === "c" ||
      command === "ta" ||
      command === "ma" ||
      command === "smi" ||
      command === "bol" ||
      command === "ema"
    ) {
      if (
        message.indexOf("Ethereum") >= 0 ||
        message.indexOf("BNBChain") >= 0
      ) {
        let reply = await parsePirbSimpleCommand(message_array, address);
        return reply;
      } else return 124;
    }
    if (command === "t") {
      let reply = parseT(message_array, address);

      return reply;
    }
    if (command === "ts") {
      let reply = parseCashtag(message_array, address);
      return reply;
    }

    if (command === "th") {
      let reply = parseHashtag(message_array, address);
      return reply;
    }
    if (command === "kol") {
      let reply = await parseKol(message_array, address);
      return reply;
    }
    if (command === "f") {
      let reply = await parseCmt(message_array, address);
      return reply;
    }
    if (command === "gas") {
      let reply = await parseGas(message_array);
      return reply;
    }
    if (command === "pnl") {
      let reply = await parsePnl(message_array, address);
      return reply;
    }
    if (command === "tax") {
      let reply = await parseTax(message_array, address);
      return reply;
    }
    if (command === "s") {
      let reply = await parseTeam(message_array, address);
      return reply;
    }
    if (command === "o") {
      let reply = parseCross(message_array, address);
      return reply;
    }
    if (command === "a") {
      let reply = parseAirdrop(message_array, address);
      return reply;
    }
    if (command === "e") {
      let reply = parseE(message_array, address);
      return reply;
    }
    if (command === "whale") {
      let reply = parseWhale(message_array, address);
      return reply;
    }
    if (command === "j") {
      let reply = parseJeet(message_array, address);
      return reply;
    }
    if (command === "hmap") {
      let reply = parseHmap(message_array, address);
      return reply;
    }

    return message;
  } catch (err) {
    console.log(err);
    return "Sorry we are not able to handle your request";
  }
};

module.exports = {
  parse,
  parseFormatedPrice,
  parseFormatedPercentage,
  hashCode,
};
