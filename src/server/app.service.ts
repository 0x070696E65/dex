import { Injectable } from '@nestjs/common';
import { AggregateTransaction, CosignatureSignedTransaction } from 'symbol-sdk';
import {
  createCosignatureTransaction,
  createAggregateBuyTransaction,
} from './utils/symbol';
@Injectable()
export class AppService {
  async createCosignatureTransaction(
    payload: string,
  ): Promise<CosignatureSignedTransaction> {
    return await createCosignatureTransaction(payload);
  }
  async createAggregateBuyTransaction(
    hash: string,
    publicKey: string,
  ): Promise<string> {
    return await createAggregateBuyTransaction(hash, publicKey);
  }
}
