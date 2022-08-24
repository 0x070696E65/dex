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
  AggregateTransactionCosignature,
} from 'symbol-sdk';
import {
  requestSignEncription,
  setTransaction,
  requestSign,
  setMessage,
} from 'sss-module';
import { sha3_256 } from 'js-sha3';
import { apiClient } from 'src/shared/lib/apiClient';
import { BuyTransaction, AggTransaction } from '../types';
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

const createSellTransaction = async (
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

const createBuyTransaction = async (hash: string, publicKey: string) => {
  const aggData: AggTransaction = {
    hash,
    publicKey,
  };
  const aggregateTransactionData = await apiClient.post(
    '/api/create-aggregate-buy-transaction',
    aggData,
  );

  const aggTx = AggregateTransaction.createFromPayload(
    aggregateTransactionData.data,
  );
  setTransaction(aggTx);

  const signedTransaction = await requestSign();
  const data: BuyTransaction = {
    payload: signedTransaction.payload,
  };
  const cosignatureTransaction = await apiClient.post(
    '/api/create-cosignature-transaction',
    data,
  );
  const aggregateTransactionCosignature = new AggregateTransactionCosignature(
    cosignatureTransaction.data.signature,
    exchangePublicAccount,
  );
  aggTx.cosignatures.push(aggregateTransactionCosignature);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  setTransaction(aggTx);
  const signedTransactionComplete = await requestSign();
  const result = await txRepo.announce(signedTransactionComplete).toPromise();
  return result;
};

export default { createSellTransaction, createBuyTransaction };
