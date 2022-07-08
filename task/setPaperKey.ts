import { task, types } from "hardhat/config";
import { CollectionConfig } from "../config/CollectionConfig";

task("setPaperKey", "sets the paperKey on a given contract")
  .addParam("paperKey", "The key to set too", undefined, types.string)
  .setAction(async ({ paperKey }, { ethers }) => {
    if (!CollectionConfig.deployedContractAddress) {
      console.log("\x1b[31merror\x1b[0m Deployed contract address not found");
      return;
    }
    const contract = await ethers.getContractAt(
      CollectionConfig.contractName,
      CollectionConfig.deployedContractAddress
    );

    console.log("Got contract, setting price now");
    const resp = await contract.setPaperKey(paperKey);
    console.log("resp transaction hash", resp.hash);
    const receipt = await resp.wait();
    console.log("transaction mined at: ", receipt.transactionHash);
  });
