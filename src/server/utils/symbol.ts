import {
  NetworkType,
  Account,
  CosignatureTransaction,
  Deadline,
  RepositoryFactoryHttp,
  TransactionGroup,
  AggregateTransaction,
  SecretLockTransaction,
  TransferTransaction,
  PublicAccount,
  EncryptedMessage,
  SecretProofTransaction,
  LockHashAlgorithm,
  PlainMessage,
  UInt64,
  Mosaic,
  MosaicId,
} from 'symbol-sdk';
import { Order } from '../../shared/types';
const ng = '7FCCD304802016BEBBCD342A332F91FF1F3BB5E902988B352697BE245F48E836';
const nt = NetworkType.TEST_NET;
const ea = 1637848847;
const node = 'https://hideyoshi.mydns.jp:3001';
const repo = new RepositoryFactoryHttp(node);
const txRepo = repo.createTransactionRepository();
const exchangePubkey =
  '63F391849CE99ACF97DBB5388323520CC8C7E3CCB4A739FF0F699DB3FAA991D7'; //process.env.EXCHANGE_PUBKEY;
const exchangePublicAccount = PublicAccount.createFromPublicKey(
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  exchangePubkey!,
  nt,
);

const exchangePrivatekey =
  'E2A2348F784BAA529E12D2E1B7FFFC9FDD76ABD1C3F649CA82231E24A0C84F94'; //process.env.EXCHANGE_PRIVATEKEY;
const exchangeAccount = Account.createFromPrivateKey(
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  exchangePrivatekey!,
  nt,
);

export const createCosignatureTransaction = async (payload: string) => {
  const signedTx = CosignatureTransaction.signTransactionPayload(
    exchangeAccount,
    payload,
    ng,
  );
  return signedTx;
};

export const createAggregateBuyTransaction = async (
  hash: string,
  buyerPublicKey: string,
) => {
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
  const buyerPublicAccount = PublicAccount.createFromPublicKey(
    buyerPublicKey,
    nt,
  );
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
    UInt64.fromUint(order.buyMosaicAmount),
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
};
