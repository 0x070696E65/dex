import type { NextPage } from 'next';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { getActivePublicKey } from 'sss-module';
import sym from '../shared/lib/symbol';

const Home: NextPage = () => {
  const CreateSellTransaction = async () => {
    const response = await sym.createSellTransaction(
      getActivePublicKey(),
      '65DBB4CC472A5734',
      1,
      '3A8416DB2D53B6C8',
      1,
    );
    console.log(response);
  };
  const CreateBuyTransaction = async () => {
    const hash =
      'D17352FBE0F8ECF62B0E2A47C2C8CF172E9BC909B52AF590E2D135B517CABB82';
    const result = await sym.createBuyTransaction(hash, getActivePublicKey());
    console.log(result);
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
