import type { NextPage } from 'next';
import { Box, Typography, Grid, Container } from '@mui/material';
import sym from '../shared/lib/symbol';
import { useState, useEffect } from 'react';
import { HaveMosaic, List } from '../shared/types';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import NewOrderModal from './components/NewOrderModal';
import OrderModal from './components/OrderModal';
import { getActiveAddress, isAllowedSSS } from 'sss-module';

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

  const columnsMosaic: GridColDef[] = [
    { field: 'id', headerName: 'モザイクID', width: 200 },
    { field: 'mosaicName', headerName: 'モザイク名', width: 200 },
    { field: 'mosaicAmount', headerName: '数量', type: 'number', width: 200 },
  ];

  const [datas, setDatas] = useState<List[]>([]);
  const [mosaics, setMosaics] = useState<HaveMosaic[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [order, setOrder] = useState<List>();

  useEffect(() => {
    const init = async () => {
      setTimeout(() => {
        if (!isAllowedSSS()) {
          alert('SSS Extensionをインストールし有効化してください');
        } else {
          sym.GetMosaics(getActiveAddress()).then((result) => {
            if (result == undefined) return;
            setMosaics(result);
            console.log(result);
          });
        }
      }, 500);
      sym.GetDatas().then((result) => {
        console.log(result);
        setDatas(result);
      });
    };
    init();
  }, []);

  const cellClickHandler = (event: any) => {
    setShowModal(true);
    setOrder(event.row);
  };
  return (
    <Box>
      <Typography
        variant="h3"
        component="h3"
        style={{ textAlign: 'center', marginTop: '30px' }}
      >
        トマティーナ交換所
      </Typography>
      <OrderModal
        showFlag={showModal}
        setShowModal={setShowModal}
        order={order}
      />
      <div style={{ height: 400, width: '100%' }}>
        <Grid container spacing={2} style={{ marginBottom: '20px' }}>
          <Grid item xs={8}>
            <Typography variant="h4" component="h4">
              注文一覧
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <NewOrderModal mosaics={mosaics} />
          </Grid>
        </Grid>
        <DataGrid
          rows={datas}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
          onCellClick={(event) => cellClickHandler(event)}
        />
      </div>
      <div style={{ height: 400, width: '100%', marginTop: '100px' }}>
        <Grid
          container
          spacing={2}
          style={{ marginBottom: '20px', height: '400px' }}
        >
          <Grid item xs={6}>
            <Typography variant="h4" component="h4">
              あなたのモザイク一覧
            </Typography>
            <DataGrid
              rows={mosaics}
              columns={columnsMosaic}
              pageSize={5}
              rowsPerPageOptions={[5]}
            />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="h4" component="h4">
              使い方
            </Typography>
            <Container
              style={{
                border: '1px solid rgba(81, 81, 81, 1)',
                borderRadius: '4px',
              }}
            >
              <ul>
                <li>
                  本交換所はTomatoモザイクやTheTowerゲーム内での小石、ジェムを交換できるものです。
                </li>
                <li>
                  SSS_Extensionをインストールし右クリックで有効化してください。
                </li>
                <li>
                  新たに注文する場合は、新規注文をクリックし、あなたが販売したいモザイク名を選択し数量を入力。その対価として得たいモザイク名と数量を入力して、署名をクリックするとSSSExtensionでの署名を2回求められます。
                  <br />
                  1:取引成立時のProof暗号化
                  <br />
                  2:注文トランザクションの署名
                </li>
                <li>※0.1XYM前後の手数料がかかります。</li>
                <li>
                  注文一覧には誰かが作成した注文が表示されています。自分が取引したい注文があればクリックしてください。
                </li>
                <li>
                  入手モザイク名：あなたが得られるモザイク
                  <br />
                  提供モザイク名：あなたが手放すモザイク
                </li>
                <li>
                  取引内容を見て、希望すればそのまま署名ボタンをクリックしてください。クリックするとSSSExtensionでの署名を2回求められます。
                  <br />
                  一度署名した後に、取引所の自動署名を終え、再度署名が必要なためです。
                </li>
                <li>※0.1XYM前後の手数料がかかります。</li>
                <li>
                  本交換所で発生したトラブルは一切責任を負いません。あくまでもモザイク遊びの一環として活用ください
                </li>
                <li>
                  （今の所リストされている物しか交換できませんが、ID入力方式にすればなんでもいける）
                </li>
              </ul>
            </Container>
          </Grid>
        </Grid>
      </div>
    </Box>
  );
};

export default Home;
