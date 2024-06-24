const { default: axios } = require("axios");
const { GECKO_APIS } = require("./config");

var data = {
  index: 0,
  api_keys: GECKO_APIS,
};

const chainId = {
  Ethereum: "ethereum",
  BNBChain: "binance-smart-chain",
};

const currencies = {
  Ethereum: "eth",
  BNBChain: "bnb",
};
const sleep = (t) => {
  return new Promise((res, rej) => {
    setTimeout(() => {
      res();
    }, t);
  });
};
const fetchTokenPriceInNativeCoin = async (chainName, address) => {
  let chain_id = chainId[chainName];

  if (chain_id === undefined) return 0;
  else {
    try {
      data.index = (data.index + 1) % data.api_keys.length;
      const url = `https://pro-api.coingecko.com/api/v3/simple/token_price/${chain_id}?contract_addresses=${address}&vs_currencies=${
        currencies[chainName]
      }&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true&x_cg_pro_api_key=${
        data.api_keys[data.index]
      }`;
      const res = await axios.get(url);

      if (Object.keys(res.data).length === 0) {
        return null;
      }
      let d = {
        priceInNative:
          Object.values(res.data)[0][currencies[chainName]] +
          ` ${currencies[chainName].toUpperCase()}`,
        lastUpdated: Object.values(res.data)[0].last_updated_at,
      };

      return d;
    } catch (err) {
      console.log(err);
      return null;
    }
  }
};
// const fetchTokenPriceInNativeCoin = (chainName, address) => {
//   return new Promise((resolve, rej) => {
//     let chain_id = chainId[chainName];

//     if (chain_id === undefined) return 0;
//     else {
//       const intervalId = setInterval(async () => {
//         try {
//           data.index = (data.index + 1) % data.api_keys.length;
//           const url = `https://pro-api.coingecko.com/api/v3/simple/token_price/${chain_id}?contract_addresses=${address}&vs_currencies=${
//             currencies[chainName]
//           }&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true&x_cg_pro_api_key=${
//             data.api_keys[data.index]
//           }`;
//           const res = await axios.get(url);
//           console.log("res data", res.data, url);
//           if (Object.keys(res.data).length === 0) {
//             clearInterval(intervalId);
//             resolve(null);
//           }
//           let d = {
//             priceInNative:
//               Object.values(res.data)[0][currencies[chainName]] +
//               ` ${currencies[chainName].toUpperCase()}`,
//             lastUpdated: Object.values(res.data)[0].last_updated_at,
//           };
//           clearInterval(intervalId);
//           resolve(d);
//         } catch (err) {
//           console.log(err);
//         }
//       }, 500);
//     }
//   });
// };
const fetchNativeCoinPrice = async () => {
  data.index = (data.index + 1) % data.api_keys.length;
  try {
    const url = `https://pro-api.coingecko.com/api/v3/simple/price?ids=binancecoin%2Cethereum&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true&x_cg_pro_api_key=${
      data.api_keys[data.index]
    }`;
    const res = await axios.get(url);
    return res.data;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const checkIfInValidChain = async (address) => {
  try {
    const res = await fetchTokenPriceInNativeCoin("Ethereum", address);
    if (res) {
      return true;
    }
    const res1 = await fetchTokenPriceInNativeCoin("BNBChain", address);
    if (res1) {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
};
module.exports = {
  checkIfInValidChain,
  fetchTokenPriceInNativeCoin,
  fetchNativeCoinPrice,
};
