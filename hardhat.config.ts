import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import * as dotenv from "dotenv";
import "hardhat-gas-reporter";
import { HardhatUserConfig, task } from "hardhat/config";
import "solidity-coverage";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

/*
 * If you have issues with stuck transactions or you simply want to invest in
 * higher gas fees in order to make sure your transactions will run smoother
 * and faster, then you can update the followind value.
 * This value is used by default in any network defined in this project, but
 * please make sure to add it manually if you define any custom network.
 *
 * Example:
 * Setting the value to "1.1" will raise the gas values by 10% compared to the
 * estimated value.
 */
const DEFAULT_GAS_MULTIPLIER: number = 1;

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    truffle: {
      url: "http://localhost:24012/rpc",
      timeout: 60000,
      gasMultiplier: DEFAULT_GAS_MULTIPLIER,
    },
    rinkeby: {
      url: `eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.RINKEBY_PRIVATE_KEY!],
      gasMultiplier: DEFAULT_GAS_MULTIPLIER,
    },
    mainnet: {
      url: `eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.ETH_PRIVATE_KEY!],
      gasMultiplier: DEFAULT_GAS_MULTIPLIER,
    },
    matic: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.MATIC_PRIVATE_KEY!],
      gasMultiplier: DEFAULT_GAS_MULTIPLIER,
    },
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.MUMBAI_PRIVATE_KEY!],
      gasMultiplier: DEFAULT_GAS_MULTIPLIER,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    gasPriceApi:
      "https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice",
  },
  etherscan: {
    apiKey: {
      // Ethereum
      rinkeby: process.env.ETH_BLOCK_EXPLORER_API_KEY,
      mainnet: process.env.ETH_BLOCK_EXPLORER_API_KEY,

      // Polygon
      polygon: process.env.POLYGON_BLOCK_EXPLORER_API_KEY,
      polygonMumbai: process.env.POLYGON_BLOCK_EXPLORER_API_KEY,
    },
  },
};

export default config;
