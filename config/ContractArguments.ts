import { CollectionConfig } from "./CollectionConfig";

export const ContractArguments = [
  CollectionConfig.paperKey,
  CollectionConfig.tokenName,
  CollectionConfig.tokenSymbol,
] as const;
