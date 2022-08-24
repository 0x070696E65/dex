import type { NextPage } from 'next';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { getActivePublicKey } from 'sss-module';
import { apiClient } from 'src/shared/lib/apiClient';
import { SellTransaction, BuyTransaction } from 'src/shared/types';

const Home: NextPage = () => {
  const CreateSellTransaction = async () => {
    const data: SellTransaction = {
      sellerPublicKey: getActivePublicKey(),
      buyMosaicId: '65DBB4CC472A5734',
      buyMosaicAmount: 1,
      sellMosaicId: '3A8416DB2D53B6C8',
      sellMosaicAmount: 1,
    };
    const response = await apiClient.post<SellTransaction>(
      '/api/create-sell-transaction',
      data,
    );
    console.log(response);
  };
  const CreateBuyTransaction = async () => {
    const data: BuyTransaction = {
      hash: '36F096ECDCB0CB3A5B094814ED3379314FD1EAABA435CB1D2C8CA9C867CB19FE',
    };
    const response = await apiClient.post<BuyTransaction>(
      '/api/create-buy-transaction',
      data,
    );
    console.log(response);
  };
  return (
    <Box>
      <Button
        style={{ width: '500px' }}
        variant="contained"
        color="secondary"
        onClick={CreateSellTransaction}
      >
        SELL
      </Button>
      <Button
        style={{ width: '500px' }}
        variant="contained"
        color="secondary"
        onClick={CreateBuyTransaction}
      >
        BUY
      </Button>
    </Box>
  );
};

export default Home;
