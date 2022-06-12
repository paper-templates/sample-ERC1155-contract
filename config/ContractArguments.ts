import { CollectionConfig } from "./CollectionConfig";

const ContractArguments = [
  CollectionConfig.paperKey,
  CollectionConfig.tokenName,
  CollectionConfig.tokenSymbol,
] as const;

export default ContractArguments;
