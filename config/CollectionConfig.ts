export const CollectionConfig = {
  contractName: "PaperERC1155Template",
  paperKey: "0xc763841d2845fBC51A6b5681727bbE87198Dd50D",
  tokenName: "Paper ERC1155 Template",
  tokenSymbol: "PET",
  mintDetails: [
    {
      priceInEther: 0.01,
      decimals: 18,
      address: "0x0000000000000000000000000000000000000000",
      tokenId: 0,
      maxSupply: 1_000_000,
      maxMintPerTx: 10,
      uri: "ipfs://QmZxqFxfHwqjGSYSKyVp7AR1qKQjy6Bq4YSo7GbnbnE6gc/0",
    },
    {
      priceInEther: 0.5,
      decimals: 6,
      address: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
      tokenId: 1,
      maxSupply: 1_000_000,
      maxMintPerTx: 10,
      uri: "ipfs://QmZxqFxfHwqjGSYSKyVp7AR1qKQjy6Bq4YSo7GbnbnE6gc/0",
    },
  ],
  deployedContractAddress: null,
};
