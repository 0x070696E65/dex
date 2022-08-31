import {
  RepositoryFactoryHttp,
  Crypto,
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
  SecretProofTransaction,
  TransactionGroup,
  TransactionType,
  TransactionSearchCriteria,
  AggregateTransactionInfo,
  Address,
  NetworkType,
  KeyGenerator,
} from 'symbol-sdk';
import {
  requestSignEncription,
  setTransaction,
  requestSign,
  setMessage,
} from 'sss-module';
import { sha3_256 } from 'js-sha3';
import { apiClient } from './apiClient';
import { mosaicList } from './mosaicList';
import {
  BuyTransaction,
  AggTransaction,
  List,
  Order,
  HaveMosaic,
} from '../types';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const nt = Number(process.env.NEXT_PUBLIC_NETWORK_TYPE!);
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const ea = Number(process.env.NEXT_PUBLIC_EPOC_ADJUSTMENT!);
const NODES = [
  'https://hideyoshi-node.net:3001',
  'https://sym-main-05.opening-line.jp:3001',
  'https://sym-main-03.opening-line.jp:3001',
  'https://sym-main.opening-line.jp:3001',
  'https://sym-main-01.opening-line.jp:3001',
  'https://sym-main-08.opening-line.jp:3001',
  'https://sym-main-07.opening-line.jp:3001',
  'https://sym-main-02.opening-line.jp:3001',
];
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const node = NODES[Math.floor(Math.random() * NODES.length)];
console.log(node);
const repo = new RepositoryFactoryHttp(node);
const txRepo = repo.createTransactionRepository();
const chainRepo = repo.createChainRepository();
const accRepo = repo.createAccountRepository();
const restrictionHttp = repo.createRestrictionMosaicRepository();
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const exchangePubkey = process.env.NEXT_PUBLIC_EXCHANGE_PUBKEY!;
const exchangePublicAccount = PublicAccount.createFromPublicKey(
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  exchangePubkey!,
  nt,
);
const CheckRestriction = async (pubKey: string): Promise<boolean> => {
  const query = {
    targetAddress: PublicAccount.createFromPublicKey(
      pubKey,
      NetworkType.MAIN_NET,
    ).address,
  };
  const res = await restrictionHttp.search(query).toPromise();
  if (res == undefined) return false;
  if (res.data.length == 0) return false;

  for (let i = 0; i < res.data[0].restrictions.length; i++) {
    if (
      res.data[0].restrictions[i].key.toHex() ==
        KeyGenerator.generateUInt64Key('TOMATO').toHex() &&
      res.data[0].restrictions[i].restrictionValue.toHex() ==
        UInt64.fromUint(1).toHex()
    ) {
      return true;
    }
  }
  return false;
};
const GetMosaics = async (rawAddress: string) => {
  const address = Address.createFromRawAddress(rawAddress);
  const accInfo = await accRepo.getAccountInfo(address).toPromise();
  const haveMosaicList: HaveMosaic[] = [];
  if (accInfo?.mosaics == undefined) return;
  for (let i = 0; i < accInfo.mosaics.length; i++) {
    const mosaic = mosaicList.find((m) => {
      return m.mosaicId == accInfo.mosaics[i].id.toHex();
    });
    if (mosaic == undefined) continue;
    const haveMosaic: HaveMosaic = {
      id: mosaic.mosaicId,
      mosaicName: mosaic.mosaicName,
      mosaicAmount: changeAmountFromDivisibility(
        mosaic.mosaicId,
        accInfo.mosaics[i].amount.compact(),
      ),
    };
    haveMosaicList.push(haveMosaic);
  }
  return haveMosaicList;
};
const getArraysDiff = (
  array1: SecretLockTransaction[],
  array2: SecretProofTransaction[],
) => {
  const array1SecretArray = array1.map((itm) => {
    return itm.secret;
  });
  const array2SecretArray = array2.map((itm) => {
    return itm.secret;
  });
  const arr1 = [...new Set(array1SecretArray)];
  const arr2 = [...new Set(array2SecretArray)];
  return [...arr1, ...arr2].filter((val) => {
    return !arr1.includes(val) || !arr2.includes(val);
  });
};
const GetHeight = async () => {
  const chain = await chainRepo.getChainInfo().toPromise();
  return chain?.height;
};

const GetDatas = async (height: UInt64 | undefined) => {
  const fromHeight =
    height?.compact() != undefined
      ? UInt64.fromUint(height?.compact() - 10000)
      : undefined;
  let isLockContinue = true;
  let lockCount = 1;
  let resultLockArray: SecretLockTransaction[] = [];
  while (isLockContinue) {
    const transactionSearchCriteriaLock: TransactionSearchCriteria = {
      group: TransactionGroup.Confirmed,
      type: [TransactionType.SECRET_LOCK],
      embedded: true,
      pageSize: 100,
      pageNumber: lockCount,
      fromHeight,
      recipientAddress: exchangePublicAccount.address,
    };
    const resultLock = await txRepo
      .search(transactionSearchCriteriaLock)
      .toPromise();
    if (resultLock?.data.length == 0) {
      isLockContinue = false;
    } else {
      resultLockArray =
        lockCount == 1
          ? (resultLockArray = resultLock?.data as SecretLockTransaction[])
          : resultLockArray.concat(resultLock?.data as SecretLockTransaction[]);
    }
    lockCount++;
  }

  let isProofContinue = true;
  let proofCount = 1;
  let resultProofArray: SecretProofTransaction[] = [];
  while (isProofContinue) {
    const transactionSearchCriteriaLock: TransactionSearchCriteria = {
      group: TransactionGroup.Confirmed,
      type: [TransactionType.SECRET_PROOF],
      embedded: true,
      pageSize: 100,
      pageNumber: proofCount,
      fromHeight: fromHeight,
      recipientAddress: exchangePublicAccount.address,
    };
    const resultProof = await txRepo
      .search(transactionSearchCriteriaLock)
      .toPromise();
    if (resultProof?.data.length == 0) {
      isProofContinue = false;
    } else {
      resultProofArray =
        proofCount == 1
          ? (resultProofArray = resultProof?.data as SecretProofTransaction[])
          : resultProofArray.concat(
              resultProof?.data as SecretProofTransaction[],
            );
    }
    proofCount++;
  }

  const ChateuDiff = getArraysDiff(resultLockArray, resultProofArray);

  const enferChateuDiff = resultLockArray.filter((item) => {
    return ChateuDiff.includes(item.secret);
  });
  const result: List[] = [];
  for (let i = 0; i < enferChateuDiff.length; i++) {
    const aggHash = (
      enferChateuDiff[i].transactionInfo as AggregateTransactionInfo
    ).aggregateHash;

    const tx2 = await txRepo
      .getTransaction(aggHash, TransactionGroup.Confirmed)
      .toPromise();
    const order: Order = JSON.parse(
      (
        (tx2 as AggregateTransaction)
          .innerTransactions[2] as TransferTransaction
      ).message.payload,
    );
    const sellMosaicId = enferChateuDiff[i].mosaic.id.toHex();
    const sellMosaicName = mosaicList.find((mosaic) => {
      return mosaic.mosaicId == sellMosaicId;
    })?.mosaicName;
    const buyMosaicId = order.buyMosaicId;
    const buyMosaicName = mosaicList.find((mosaic) => {
      return mosaic.mosaicId == buyMosaicId;
    })?.mosaicName;
    if (sellMosaicName == undefined || buyMosaicName == undefined)
      throw new Error('');
    const publicKey = enferChateuDiff[i].signer?.publicKey;
    if (publicKey == undefined) throw new Error('');
    const data: List = {
      id: aggHash,
      sellerPublicKey: publicKey,
      sellMosaicId,
      sellMosaicName,
      sellMosaicAmount: changeAmountFromDivisibility(
        sellMosaicId,
        enferChateuDiff[i].mosaic.amount.compact(),
      ),
      buyMosaicId,
      buyMosaicAmount: order.buyMosaicAmount,
      buyMosaicName,
    };
    result.push(data);
  }
  return result;
};

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

const changeAmountFromDivisibility = (mosaicId: string, amount: number) => {
  const mosaic = mosaicList.find((m) => {
    return m.mosaicId == mosaicId;
  });
  if (mosaic?.divisibility == undefined) return amount;
  switch (mosaic?.divisibility) {
    case 0:
      return amount;
    case 1:
      return amount / 10;
    case 2:
      return amount / 100;
    case 3:
      return amount / 1000;
    case 4:
      return amount / 10000;
    case 5:
      return amount / 100000;
    case 6:
      return amount / 1000000;
    default:
      return amount;
  }
};

const createSellTransaction = async (
  sellerPublicKey: string,
  sellMosaicId: string,
  sellMosaicAmount: number,
  buyMosaicId: string,
  buyMosaicAmount: number,
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
      new Mosaic(
        new MosaicId(sellMosaicId),
        UInt64.fromUint(
          changeAmountToDivisibility(sellMosaicId, sellMosaicAmount),
        ),
      ),
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

export default {
  createSellTransaction,
  createBuyTransaction,
  GetDatas,
  GetMosaics,
  CheckRestriction,
  GetHeight,
};
