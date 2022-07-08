import { task, types } from "hardhat/config";
import { CollectionConfig } from "../config/CollectionConfig";

task("setPrice", "sets the price of a given contract")
  .addParam(
    "price",
    "price to set the contract too",
    undefined,
    types.float || types.int
  )
  .addOptionalParam("tokenId", "token Id to set price for", 0, types.int)
  .setAction(async ({ tokenId, price }, { ethers }) => {
    if (!CollectionConfig.deployedContractAddress) {
      console.log("\x1b[31merror\x1b[0m Deployed contract address not found");
      return;
    }
    const contract = await ethers.getContractAt(
      CollectionConfig.contractName,
      CollectionConfig.deployedContractAddress
    );

    console.log("Got contract, setting price now");
    const resp = await contract.setPrice(
      tokenId,
      ethers.utils.parseEther(price.toString())
    );
    console.log("resp transaction hash", resp.hash);
    const receipt = await resp.wait();
    console.log("transaction mined at: ", receipt.transactionHash);
  });
