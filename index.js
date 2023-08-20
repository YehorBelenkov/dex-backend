const express = require("express");
const Moralis = require("moralis").default;
const axios = require("axios");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = 3001;

app.use(cors());
app.use(express.json());

// Existing endpoint for fetching token price
app.get("/tokenPrice", async (req, res) => {
  const { query } = req;

  const responseOne = await Moralis.EvmApi.token.getTokenPrice({
    address: query.addressOne,
  });
  const responseTwo = await Moralis.EvmApi.token.getTokenPrice({
    address: query.addressTwo,
  });

  const usdPrices = {
    tokenOne: responseOne.raw.usdPrice,
    tokenTwo: responseTwo.raw.usdPrice,
    ratio: responseOne.raw.usdPrice / responseTwo.raw.usdPrice,
  };

  console.log(responseOne.raw);
  console.log(responseTwo.raw);
  return res.status(200).json(usdPrices);
});

// New endpoint for fetching allowance data without /api
app.get("/fetchAllowance", async (req, res) => {
  try {
    const { tokenOne, address } = req.query;

    const allowanceResponse = await axios.get(`https://api.1inch.io/v5.2/1/approve/allowance?tokenAddress=${tokenOne}&walletAddress=${address}`);

    // Send allowance data as response
    res.status(200).json(allowanceResponse.data);
  } catch (error) {
    console.error("Error fetching allowance:", error);
    res.status(500).json({ error: "An error occurred while fetching allowance data" });
  }
});

// New endpoint for fetching swap data without /api
app.get("/fetchSwap", async (req, res) => {
  try {
    const { tokenOne, tokenTwo, tokenOneAmount, address, slippage } = req.query;

    // Fetch approval status
    const allowanceResponse = await axios.get(`https://api.1inch.io/v5.2/1/approve/allowance?tokenAddress=${tokenOne}&walletAddress=${address}`);
    
    if (allowanceResponse.data.allowance === "0") {
      // Fetch approval transaction
      const approveResponse = await axios.get(`https://api.1inch.io/v5.2/1/approve/transaction?tokenAddress=${tokenOne}`);

      // Send approval transaction details as response
      res.status(200).json({ approveTx: approveResponse.data });
    } else {
      // Fetch swap transaction
      const swapResponse = await axios.get(
        `https://api.1inch.io/v5.2/1/swap?fromTokenAddress=${tokenOne}&toTokenAddress=${tokenTwo}&amount=${tokenOneAmount.padEnd(tokenOne.decimals + tokenOneAmount.length, '0')}&fromAddress=${address}&slippage=${slippage}`
      );

      // Send swap transaction details as response
      res.status(200).json({ swapTx: swapResponse.data });
    }
  } catch (error) {
    console.error("Error fetching swap:", error);
    res.status(500).json({ error: "An error occurred while fetching swap data" });
  }
});
app.get("/fetchTx", async (req, res) => {
  try {
    const { tokenOne, tokenTwo, tokenOneAmount, address, slippage } = req.query;

    const txResponse = await axios.get(
      `https://api.1inch.io/v5.2/1/swap?fromTokenAddress=${tokenOne}&toTokenAddress=${tokenTwo}&amount=${tokenOneAmount.padEnd(tokenOne.decimals + tokenOneAmount.length, '0')}&fromAddress=${address}&slippage=${slippage}`
    );

    // Send tx transaction details as response
    res.status(200).json({ tx: txResponse.data });
  } catch (error) {
    console.error("Error fetching tx:", error);
    res.status(500).json({ error: "An error occurred while fetching tx data" });
  }
});
Moralis.start({
  apiKey: process.env.MORALIS_KEY,
}).then(() => {
  app.listen(port, () => {
    console.log(`Backend server is running on port ${port}`);
  });
});