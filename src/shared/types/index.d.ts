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

export type List = {
  id: string;
  sellerPublicKey: string;
  sellMosaicId: string;
  sellMosaicName: string;
  sellMosaicAmount: number;
  buyMosaicId: string;
  buyMosaicAmount: number;
  buyMosaicName: string;
};

export type Mosaic = {
  mosaicId: string;
  mosaicName: string;
  divisibility: number;
};
