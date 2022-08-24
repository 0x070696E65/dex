export type SellTransaction = {
  sellerPublicKey: string;
  buyMosaicId: string;
  buyMosaicAmount: number;
  sellMosaicId: string;
  sellMosaicAmount: number;
};

export type BuyTransaction = {
  hash: string;
};
