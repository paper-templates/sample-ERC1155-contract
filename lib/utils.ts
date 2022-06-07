import { CollectionConfig } from "../config/CollectionConfig";

export function nonce(length: number) {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function getTokenIds() {
  const mintDetails = CollectionConfig.mintDetails;
  if (!mintDetails || !mintDetails.length) {
    throw new Error("Missing 'mintDetails' in collectionConfig");
  }
  return mintDetails.map((details) => details.tokenId);
}

export function getFirstTokenId(tokenId: Array<number>) {
  return tokenId[0];
}
