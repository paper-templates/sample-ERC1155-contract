import { ethers } from "hardhat";
import { CollectionConfig } from "../config/CollectionConfig";
import { PaperERC1155Template } from "../typechain-types";

export type NftContractType = PaperERC1155Template;

export class NftContractProvider {
  public static async getContract(): Promise<NftContractType> {
    // Check configuration
    if (CollectionConfig.deployedContractAddress === null) {
      throw new Error(
        "\x1b[31merror\x1b[0m " +
          "Please add the contract address to the configuration before running this command."
      );
    }

    if (
      (await ethers.provider.getCode(
        CollectionConfig.deployedContractAddress
      )) === "0x"
    ) {
      throw new Error(
        "\x1b[31merror\x1b[0m " +
          `Can't find a contract deployed to the target address: ${CollectionConfig.deployedContractAddress}`
      );
    }

    return (await ethers.getContractAt(
      CollectionConfig.contractName,
      CollectionConfig.deployedContractAddress
    )) as NftContractType;
  }
}
