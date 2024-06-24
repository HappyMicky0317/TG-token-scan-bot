// const CryptoJS = require("crypto-js");
// const { Web3 } = require("web3");
// const { SECRET_KEY, RPC, MAIN_WALLET } = require("./config");
// const { default: BigNumber } = require("bignumber.js");
// const { SimpleAd } = require("./models/advertisement");
// const User = require("./models/users");

// var web3 = new Web3(RPC);

// const latestBlock = {};
// const validateDateFormat = (dateString) => {
//   const pattern = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
//   return pattern.test(dateString);
// };

// const sendEth = async (id, walletAddress) => {
//   try {
//     const balance = await web3.eth.getBalance(walletAddress);
//     const hash = web3.utils.keccak256(
//       encryptStringWithSecretKey(String(id), SECRET_KEY)
//     );
//     const gasPrice = await web3.eth.getGasPrice();
//     const value = new BigNumber(balance)
//       .minus(new BigNumber(21000).multipliedBy(new BigNumber(gasPrice)))
//       .toString();
//     // console.log(value);
//     const txObject = {
//       from: walletAddress,
//       to: MAIN_WALLET,
//       value,
//       gasLimit: 21000,
//       gasPrice: gasPrice,
//     };
//     const signedTx = await web3.eth.accounts.signTransaction(txObject, hash);
//     await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
//   } catch (err) {
//     console.log(err);
//   }
// };

// const setTransaction = async (walletAddress) => {
//   try {
//     const address = walletAddress.toLowerCase();
//     const res = await web3.eth.getBlockNumber();
//     latestBlock[address] = Number(res);
//   } catch (err) {}
// };

// const checkTransaction = async (txId, walletAddress, amount, data, chatId) => {
//   try {
//     const address = walletAddress.toLowerCase();
//     const txDetails = await web3.eth.getTransaction(txId);

//     if (
//       txDetails.to === address &&
//       new BigNumber(txDetails.value).isEqualTo(
//         new BigNumber(amount).multipliedBy(10 ** 18)
//       ) &&
//       Number(txDetails.blockNumber) > latestBlock[address]
//     ) {
//       latestBlock[address] = Number(txDetails.blockNumber);
//       await addAdvertiseMent(
//         chatId,
//         data.title,
//         data.description,
//         data.link,
//         data.date
//       );
//       sendEth(chatId, walletAddress, amount);
//       return true;
//     } else {
//       return false;
//     }
//   } catch (error) {
//     console.error("Error getting transaction details:", error);
//     return false;
//   }
// };

// const handleStartCommand = async (chatId, bot) => {
//   const today = Date.now();

//   let keyboards = [[]];
//   let row = 0;
//   for (let i = 0; i < 31; i++) {
//     let d = new Date(today + i * 86400 * 1000);
//     if (i >= (row + 1) * 5) {
//       row = row + 1;
//       keyboards.push([]);
//     }
//     let text = d.toLocaleDateString("en", {
//       day: "2-digit",
//       month: "2-digit",
//       year: "numeric",
//     });
//     let splittedText = text.split("/");
//     keyboards[row].push({
//       text: `${splittedText[0]}-${splittedText[1]}`,
//       callback_data: text,
//     });
//   }

//   const keyboard = {
//     reply_markup: {
//       inline_keyboard: keyboards,
//     },
//   };
//   const replyMsg = `
//   🙋🏼‍♀️ Welcome to the automated BuildView Ad System!

// ✨You can book advertisements here, which will be displayed beneath all BuildView scans.

// Please choose a date for your ad to be published. Ads will be active on the selected day from 00:00 UTC to 23:59 UTC.

// If you schedule an ad during a day that has already started, it will be displayed immediately and run until 23:59 UTC of that same day.

// You can book up to 6 ads per day, and each ad will be equally displayed through rotation.

// Ad cost per day: 0.10 ETH

// 💪 If you wish to promote your project via private messages to all BuildView Users, please reach out to @Karenluptin for assistance (Ad cost per day: 0.25 ETH).

// 🚫 Advertisements must adhere to our community standards. Any ads promoting deceptive practices, explicit content, or products related to gambling, alcohol, or drugs will be promptly removed. Users violating these guidelines may face removal of their ads and potential exclusion from future advertising opportunities.
// 🚫 Please note that we have a no refund policy.
// `;
//   bot.telegram.sendMessage(chatId, replyMsg, {
//     parse_mode: "HTML",
//     ...keyboard,
//   });
// };

// const validateAdText = (str, len = 150) => {
//   if (str.length > len) return false;
//   return true;
// };

// function encryptStringWithSecretKey(inputString, secretKey) {
//   const encrypted = CryptoJS.HmacMD5(inputString, secretKey).toString();
//   return encrypted;
// }

// const createWalletFromString = (id) => {
//   const hash = web3.utils.keccak256(
//     encryptStringWithSecretKey(String(id), SECRET_KEY)
//   );

//   // Extract the first 32 bytes (256 bits) to use as the private key
//   // const privateKey = "0x" + hash.substring(24); // Ensure it starts with '0x' and is 64 characters long

//   // return hash;
//   const res = web3.eth.accounts.privateKeyToAccount(hash);
//   return res.address;
// };

// const checkIfDateAvaialble = async (date) => {
//   try {
//     const res = await SimpleAd.find({ date });
//     return res.length < 6;
//   } catch (err) {
//     console.log(err);
//     return false;
//   }
// };
// const addAdvertiseMent = async (chatID, title, description, link, date) => {
//   try {
//     const user = await User.findOne({ chatID });
//     const data = new SimpleAd({
//       date,
//       title,
//       description,
//       link,
//       user: user._id,
//     });
//     await data.save();
//   } catch (err) {
//     console.log(err);
//   }
// };
// const getAdvertisement = async (index) => {
//   try {
//     const date = new Date().toLocaleDateString("en", {
//       day: "2-digit",
//       month: "2-digit",
//       year: "numeric",
//     });
//     const res = await SimpleAd.find({ date });
//     let ads = [
//       {
//         title: "BuildAI: Ultimate Artificial Intelligence Hub For Web3",
//         link: "https://t.me/BuildAiPortal",
//         description: "BuildAI: Ultimate Artificial Intelligence Hub For Web3",
//       },
//       ...res,
//     ];
//     let len = ads.length;
//     index = (index + 1) % len;
//     const data = ads[index];
//     const message = `Ad: <a href="${data.link}">${data.title}</a>`;
//     // console.log(message);
//     return {
//       message,
//       index,
//     };
//   } catch (err) {
//     console.log(err);
//     return null;
//   }
// };
// module.exports = {
//   validateDateFormat,
//   getAdvertisement,
//   checkIfDateAvaialble,
//   createWalletFromString,
//   handleStartCommand,
//   validateAdText,
//   checkTransaction,
//   addAdvertiseMent,
//   setTransaction,
//   sendEth,
// };
