export const CollectionConfig = {
  contractName: "PaperERC1155Template",
  tokenName: "Paper ERC1155 Template",
  tokenSymbol: "PET",
  mintDetails: [
    {
      priceInEther: 2,
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
  deployedContractAddress: "0x9E6f4CB4e02Bc2153a1Ba8b74104b1ED44260518",
};
