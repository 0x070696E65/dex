import {
  RepositoryFactoryHttp,
  Crypto,
  NetworkType,
  PublicAccount,
  SecretLockTransaction,
  Deadline,
  Mosaic,
  MosaicId,
  UInt64,
  LockHashAlgorithm,
  TransferTransaction,
  PlainMessage,
  AggregateTransaction,
  TransactionGroup,
  EncryptedMessage,
  SecretProofTransaction,
  Account,
} from 'symbol-sdk';
import {
  requestSignEncription,
  setTransaction,
  requestSign,
  setMessage,
  getActivePublicKey,
  requestSignWithCosignatories,
} from 'sss-module';
import { sha3_256 } from 'js-sha3';

const node = 'https://hideyoshi.mydns.jp:3001';
const repo = new RepositoryFactoryHttp(node);
const txRepo = repo.createTransactionRepository();
const ea = 1637848847;
const ng = '7FCCD304802016BEBBCD342A332F91FF1F3BB5E902988B352697BE245F48E836';
const nt = NetworkType.TEST_NET;

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

export const createSellTransaction = async (
  sellerPublicKey: string,
  buyMosaicId: string,
  buyMosaicAmount: number,
  sellMosaicId: string,
  sellMosaicAmount: number,
) => {
  try {
    const random = Crypto.randomBytes(20);
    const hash = sha3_256.create();
    const secret = hash.update(random).hex();
    const proof = random.toString('hex');

    const order = {
      buyMosaicId,
      buyMosaicAmount,
    };

    const sellderPublicAccount = PublicAccount.createFromPublicKey(
      sellerPublicKey,
      nt,
    );
    const deadline = Deadline.create(ea);

    const lockTx = SecretLockTransaction.create(
      deadline,
      new Mosaic(new MosaicId(sellMosaicId), UInt64.fromUint(sellMosaicAmount)),
      UInt64.fromUint(10000),
      LockHashAlgorithm.Op_Sha3_256,
      secret,
      exchangePublicAccount.address,
      nt,
    );

    console.log(proof);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    setMessage(proof, exchangePubkey!);
    const encryptedMessage = await requestSignEncription();

    const proofTx = TransferTransaction.create(
      deadline,
      exchangePublicAccount.address,
      [],
      encryptedMessage,
      nt,
    );

    const infoTx = TransferTransaction.create(
      deadline,
      exchangePublicAccount.address,
      [],
      PlainMessage.create(JSON.stringify(order)),
      nt,
    );

    const aggTx = AggregateTransaction.createComplete(
      deadline,
      [
        lockTx.toAggregate(sellderPublicAccount),
        proofTx.toAggregate(sellderPublicAccount),
        infoTx.toAggregate(sellderPublicAccount),
      ],
      nt,
      [],
    ).setMaxFeeForAggregate(100, 0);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    setTransaction(aggTx);
    const signedTransaction = await requestSign();
    const result = await txRepo.announce(signedTransaction).toPromise();
    if (result == undefined) throw new Error('announce failed');
    return result;
  } catch (e) {
    console.error(e);
  }
};

export const createBuyTransaction = async (hash: string) => {
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
  const buyerPublicKey = getActivePublicKey();
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
  console.log(secret);
  console.log(proof);

  const order: Order = JSON.parse(
    (
      (aggTx as AggregateTransaction)
        .innerTransactions[2] as TransferTransaction
    ).message.payload,
  );
  console.log(order);

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
    PlainMessage.create('指定したモザイクを入手しました'),
    nt,
  );

  const sellMosaic = secretLockTransaction.mosaic;
  const lastTx = TransferTransaction.create(
    deadline,
    buyerPublicAccount.address,
    [sellMosaic],
    PlainMessage.create('指定したモザイクを入手しました'),
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

  setTransaction(aggTx2);
  const signedTransaction = await requestSignWithCosignatories([
    exchangeAccount,
  ]);
  const result = await txRepo.announce(signedTransaction).toPromise();
  return result;
};

type Order = {
  buyMosaicId: string;
  buyMosaicAmount: number;
};
