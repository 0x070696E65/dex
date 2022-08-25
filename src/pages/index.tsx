import type { NextPage } from 'next';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { getActivePublicKey } from 'sss-module';
import sym from '../shared/lib/symbol';
import { useState, useEffect } from 'react';
import { List } from '../shared/types';
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
import NewOrderModal from './components/NewOrderModal';
import OrderModal from './components/OrderModal';

const Home: NextPage = () => {
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'Hash', width: 200 },
    { field: 'sellMosaicId', headerName: '入手モザイクID', width: 200 },
    { field: 'sellMosaicName', headerName: '入手モザイク名', width: 200 },
    {
      field: 'sellMosaicAmount',
      headerName: '入手モザイク量',
      type: 'number',
      width: 100,
    },
    { field: 'buyMosaicId', headerName: '提供モザイクID', width: 200 },
    { field: 'buyMosaicName', headerName: '提供モザイク名', width: 200 },
    {
      field: 'buyMosaicAmount',
      headerName: '提供モザイク量',
      type: 'number',
      width: 100,
    },
  ];

  const [datas, setDatas] = useState<List[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [order, setOrder] = useState<List>();

  useEffect(() => {
    const init = async () => {
      const data = await sym.GetDatas();
      console.log(data);
      setDatas(data);
    };
    init();
  }, []);

  const CreateBuyTransaction = async () => {
    const hash =
      'D17352FBE0F8ECF62B0E2A47C2C8CF172E9BC909B52AF590E2D135B517CABB82';
    const result = await sym.createBuyTransaction(hash, getActivePublicKey());
    console.log(result);
  };
  const cellClickHandler = (event: any) => {
    setShowModal(true);
    setOrder(event.row);
  };
  const handleOpen = () => {
    console.log('open');
  };
  const handleClose = () => {
    console.log('close');
  };
  return (
    <Box>
      <OrderModal
        showFlag={showModal}
        setShowModal={setShowModal}
        order={order}
      />
      <NewOrderModal />
      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={datas}
          columns={columns}
          pageSize={15}
          rowsPerPageOptions={[15]}
          onCellClick={(event) => cellClickHandler(event)}
        />
      </div>
    </Box>
  );
};

export default Home;
