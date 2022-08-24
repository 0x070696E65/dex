export type SellTransaction = {
  sellerPublicKey: string;
  buyMosaicId: string;
  buyMosaicAmount: number;
  sellMosaicId: string;
  sellMosaicAmount: number;
};

export type BuyTransaction = {
  payload: string;
};

export type AggTransaction = {
  hash: string;
  publicKey: string;
};

export type Order = {
  buyMosaicId: string;
  buyMosaicAmount: number;
};
