import { ethers } from "ethers";
import { CollectionConfig } from "../config/CollectionConfig";
import { NftContractProvider } from "../lib/NftContractProvider";

async function main() {
  const contract = await NftContractProvider.getContract();

  console.log("Got contract, deploying tokens now");
  const tokensLaunch = [];
  for (const token of CollectionConfig.mintDetails) {
    console.log("Deploying token: ", token);
    const resp = await contract.launchToken(
      token.tokenId,
      ethers.utils.parseEther(token.priceInEther.toString()),
      token.maxSupply,
      token.maxMintPerTx,
      token.uri
    );
    console.log("Deployed token with txHash: ", resp.hash);
    tokensLaunch.push(resp);
  }
  console.log("Waiting for all transactions to be mined");
  await Promise.all(tokensLaunch);
  console.log("All transactions mined");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
