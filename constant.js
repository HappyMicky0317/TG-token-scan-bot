const OttoSimBotChatId = 6233195423;
const TTFBotChatId = 6113783210;
const PirbChatId = 6362041475;
const keyboardsAnalyze = (address) => {
  return [
    [
      {
        callback_data: `/x ${address}`,
        message: `/x ${address}`,
        text: "🐦",
      },
      {
        callback_data: `/cmt ${address}`,
        message: `/cmt ${address}`,
        text: "👨‍👩‍👧‍👦",
      },
      {
        callback_data: `/kol ${address}`,
        message: `/kol ${address}`,
        text: "🌟",
      },
      {
        callback_data: `/c ${address}`,
        message: `/c ${address}`,
        text: "💹",
      },
      {
        callback_data: `/ta ${address}`,
        message: `/ta ${address}`,
        text: "🕵🏻‍♂️",
      },
    ],

    [
      {
        callback_data: `/ma ${address}`,
        message: `/ma ${address}`,
        text: "🚶🏻‍♀️",
      },
      {
        callback_data: `/smi ${address}`,
        message: `/smi ${address}`,
        text: "📉",
      },

      {
        callback_data: `/bol ${address}`,
        message: `/bol ${address}`,
        text: "🩹",
      },
      {
        callback_data: `/ema ${address}`,
        message: `/ema ${address}`,
        text: "🏃🏻‍♀️",
      },
      {
        callback_data: `/h ${address}`,
        message: `/h ${address}`,
        text: "🎩",
      },
    ],
    [
      {
        callback_data: `/jeet ${address}`,
        message: `/jeet ${address}`,
        text: "🤬",
      },
      {
        callback_data: `/tax ${address}`,
        message: `/tax ${address}`,
        text: "🏧",
      },
      {
        callback_data: `/hmp ${address}`,
        message: `/hmp ${address}`,
        text: "🎭",
      },
      {
        callback_data: `/whale ${address}`,
        message: `/whale ${address}`,
        text: "🐋",
      },
      {
        callback_data: `/e ${address}`,
        message: `/e ${address}`,
        text: "🐣",
      },
    ],
  ];
};
const NoDetect = "Couldn't detect a blockchain for the address";
const NonSupport = "BuildViewBot supports only ETH and BSC at the moment";

module.exports = {
  NonSupport,
  NoDetect,
  keyboardsAnalyze,
  OttoSimBotChatId,
  TTFBotChatId,
  PirbChatId,
};
