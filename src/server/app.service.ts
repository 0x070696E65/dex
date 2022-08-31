import { Injectable } from '@nestjs/common';
import {
  AggregateTransaction,
  CosignatureSignedTransaction,
  CosignatureTransaction,
  Account,
  RepositoryFactoryHttp,
  PublicAccount,
  Deadline,
  TransactionGroup,
  SecretLockTransaction,
  EncryptedMessage,
  TransferTransaction,
  SecretProofTransaction,
  LockHashAlgorithm,
  Mosaic,
  MosaicId,
  UInt64,
  PlainMessage,
} from 'symbol-sdk';
import { Order } from '../shared/types';
import { mosaicList } from '../shared/lib/mosaicList';
@Injectable()
export class AppService {
  createCosignatureTransaction({
    payload,
  }: {
    payload: string;
  }): CosignatureSignedTransaction {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const ng = process.env.NETWORK_GENERATIONHASH!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const nt = Number(process.env.NETWORK_TYPE!);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const exchangePrivatekey = process.env.EXCHANGE_PRIVATEKEY!;
    const exchangeAccount = Account.createFromPrivateKey(
      exchangePrivatekey,
      nt,
    );
    const signedTx = CosignatureTransaction.signTransactionPayload(
      exchangeAccount,
      payload,
      ng,
    );
    return signedTx;
  }
  async createAggregateBuyTransaction(
    hash: string,
    publicKey: string,
  ): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const nt = Number(process.env.NETWORK_TYPE!);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const ea = Number(process.env.EPOC_ADJUSTMENT!);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const node = process.env.NEXT_PUBLIC_NODE_URL!;
    const repo = new RepositoryFactoryHttp(node);
    const txRepo = repo.createTransactionRepository();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const exchangePubkey = process.env.EXCHANGE_PUBKEY!;
    const exchangePublicAccount = PublicAccount.createFromPublicKey(
      exchangePubkey,
      nt,
    );

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const exchangePrivatekey = process.env.EXCHANGE_PRIVATEKEY!;
    const exchangeAccount = Account.createFromPrivateKey(
      exchangePrivatekey,
      nt,
    );

    const deadline = Deadline.create(ea);
    const aggTx = await txRepo
      .getTransaction(hash, TransactionGroup.Confirmed)
      .toPromise();
    const secretLockTransaction = (aggTx as AggregateTransaction)
      .innerTransactions[0] as SecretLockTransaction;
    const secret = secretLockTransaction.secret;
    if (secretLockTransaction.signer == undefined)
      throw new Error('secretLockTransaction.signer is undefined');
    const sellerPublicKey = secretLockTransaction.signer.publicKey;
    const sellerPublicAccount = PublicAccount.createFromPublicKey(
      sellerPublicKey,
      nt,
    );
    const buyerPublicAccount = PublicAccount.createFromPublicKey(publicKey, nt);
    const encryptedMessage = new EncryptedMessage(
      (
        (aggTx as AggregateTransaction)
          .innerTransactions[1] as TransferTransaction
      ).message.payload,
      exchangePublicAccount,
    );

    const proof = exchangeAccount.decryptMessage(
      encryptedMessage,
      sellerPublicAccount,
    ).payload;

    const order: Order = JSON.parse(
      (
        (aggTx as AggregateTransaction)
          .innerTransactions[2] as TransferTransaction
      ).message.payload,
    );

    const proofTx = SecretProofTransaction.create(
      deadline,
      LockHashAlgorithm.Op_Sha3_256,
      secret,
      exchangePublicAccount.address,
      proof,
      nt,
    );

    const buyMosaic = new Mosaic(
      new MosaicId(order.buyMosaicId),
      UInt64.fromUint(
        changeAmountToDivisibility(order.buyMosaicId, order.buyMosaicAmount),
      ),
    );
    const returnTx = TransferTransaction.create(
      deadline,
      sellerPublicAccount.address,
      [buyMosaic],
      PlainMessage.create('売り手が手に入れるトランザクション'),
      nt,
    );

    const sellMosaic = secretLockTransaction.mosaic;
    const lastTx = TransferTransaction.create(
      deadline,
      buyerPublicAccount.address,
      [sellMosaic],
      PlainMessage.create('買い手が手に入れるトランザクション'),
      nt,
    );

    const aggTx2 = AggregateTransaction.createComplete(
      deadline,
      [
        proofTx.toAggregate(exchangePublicAccount),
        returnTx.toAggregate(buyerPublicAccount),
        lastTx.toAggregate(exchangePublicAccount),
      ],
      nt,
      [],
    ).setMaxFeeForAggregate(100, 1);
    return aggTx2.serialize();
  }
  async watchTransaction() {
    return new Promise(function (resolve, reject) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const node = process.env.NEXT_PUBLIC_NODE_URL!;
      const repo = new RepositoryFactoryHttp(node);
      const listener = repo.createListener();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const nt = Number(process.env.NETWORK_TYPE!);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const exchangePubkey = process.env.EXCHANGE_PUBKEY!;
      const exchangePublicAccount = PublicAccount.createFromPublicKey(
        exchangePubkey,
        nt,
      );
      try {
        listener
          .open()
          .then(async () => {
            listener.newBlock();
            listener.confirmed(exchangePublicAccount.address).subscribe(() => {
              resolve('reload');
            });
          })
          .catch((e: any) => {
            reject(e.message);
          });
      } catch (e: any) {
        listener.close();
        return e.message;
      }
    });
  }
}

const changeAmountToDivisibility = (mosaicId: string, amount: number) => {
  const mosaic = mosaicList.find((m) => {
    return m.mosaicId == mosaicId;
  });
  if (mosaic?.divisibility == undefined) return amount;
  switch (mosaic?.divisibility) {
    case 0:
      return amount;
    case 1:
      return amount * 10;
    case 2:
      return amount * 100;
    case 3:
      return amount * 1000;
    case 4:
      return amount * 10000;
    case 5:
      return amount * 100000;
    case 6:
      return amount * 1000000;
    default:
      return amount;
  }
};
