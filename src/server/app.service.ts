import { Injectable } from '@nestjs/common';
import { SellTransaction } from 'src/shared/types';
import { TransactionAnnounceResponse } from 'symbol-sdk';
import { createSellTransaction, createBuyTransaction } from './utils/symbol';
@Injectable()
export class AppService {
  async createSellTransaction(
    sellTransaction: SellTransaction,
  ): Promise<TransactionAnnounceResponse | undefined> {
    try {
      const result = await createSellTransaction(
        sellTransaction.sellerPublicKey,
        sellTransaction.buyMosaicId,
        sellTransaction.buyMosaicAmount,
        sellTransaction.sellMosaicId,
        sellTransaction.sellMosaicAmount,
      );
      return result;
    } catch (e) {
      console.error(e);
    }
  }
  async createBuyTransaction(
    hash: string,
  ): Promise<TransactionAnnounceResponse | undefined> {
    try {
      const result = await createBuyTransaction(hash);
      return result;
    } catch (e) {
      console.error(e);
    }
  }
}
