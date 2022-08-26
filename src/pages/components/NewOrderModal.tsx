import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { getActivePublicKey } from 'sss-module';
import sym from '../../shared/lib/symbol';
import {
  FormControl,
  Typography,
  InputLabel,
  Modal,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import { Formik } from 'formik';
import { mosaicList } from 'src/shared/lib/mosaicList';
import { Mosaic, HaveMosaic } from 'src/shared/types';
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  bgcolor: 'background.paper',
  //border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};
const getArraysAnd = (array1: Mosaic[], array2: HaveMosaic[]) => {
  const array1Array = array1.map((itm) => {
    return itm.mosaicId;
  });
  const array2Array = array2.map((itm) => {
    return itm.id;
  });
  const arr1 = [...new Set(array1Array)];
  const arr2 = [...new Set(array2Array)];
  return [...arr1, ...arr2].filter((val) => {
    return arr1.includes(val) && arr2.includes(val);
  });
};
export default function NewOrderModal(props: any) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const haveMosaic: HaveMosaic[] = props.mosaics;
  const ChateuDiff = getArraysAnd(mosaicList, haveMosaic);
  const enferChateuDiff = haveMosaic.filter((item) => {
    return ChateuDiff.includes(item.id);
  });
  const checkMaxAmount = (mosaicName: string) => {
    const max = haveMosaic.find((mosaic) => {
      return mosaic.mosaicName == mosaicName;
    })?.mosaicAmount;
    return max;
  };
  const mosaicSellListData = enferChateuDiff.map((mosaic) => (
    <MenuItem key={mosaic.mosaicName} value={mosaic.mosaicName}>
      {mosaic.mosaicName}
    </MenuItem>
  ));
  const mosaicBuyListData = mosaicList.map((mosaic) => (
    <MenuItem key={mosaic.mosaicName} value={mosaic.mosaicName}>
      {mosaic.mosaicName}
    </MenuItem>
  ));
  const getMosaicId = (mosaicName: string) => {
    const mosaicId = mosaicList.find((mosaic) => {
      return mosaic.mosaicName == mosaicName;
    })?.mosaicId;
    if (mosaicId == undefined) throw new Error('MosaicIdが存在しません');
    return mosaicId;
  };
  const CreateSellTransaction = async (
    sellMosaicId: string,
    sellMosaicAmount: number,
    buyMosaicId: string,
    buyMosaicAmount: number,
  ) => {
    const response = await sym.createSellTransaction(
      getActivePublicKey(),
      sellMosaicId,
      sellMosaicAmount,
      buyMosaicId,
      buyMosaicAmount,
    );
    console.log(response);
    handleClose();
  };
  return (
    <Box>
      <Button
        onClick={handleOpen}
        style={{ width: '500px' }}
        variant="outlined"
        color="success"
      >
        新規注文
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography
            id="modal-modal-title"
            variant="h6"
            component="h2"
            style={{
              marginBottom: '30px',
              fontWeight: 'bold',
              borderBottom: '1px solid',
            }}
          >
            新規注文
          </Typography>
          <Formik
            initialValues={{
              sellMosaicName: '',
              sellMosaicAmount: 1,
              buyMosaicName: '',
              buyMosaicAmount: 1,
            }}
            onSubmit={(values) => {
              CreateSellTransaction(
                getMosaicId(values.sellMosaicName),
                values.sellMosaicAmount,
                getMosaicId(values.buyMosaicName),
                values.buyMosaicAmount,
              );
            }}
            render={(props) => (
              <form onSubmit={props.handleSubmit}>
                <FormControl style={{ width: '70%' }}>
                  <InputLabel id="demo-simple-select-label">
                    販売モザイク名
                  </InputLabel>
                  <Select
                    name="sellMosaicName"
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    label="販売モザイク名"
                    value={props.values.sellMosaicName}
                    onChange={props.handleChange}
                  >
                    {mosaicSellListData}
                  </Select>
                </FormControl>
                <FormControl style={{ width: '28%', marginLeft: '2%' }}>
                  <TextField
                    id="outlined-basic"
                    name="sellMosaicAmount"
                    label="販売モザイク量"
                    variant="outlined"
                    type={'number'}
                    value={props.values.sellMosaicAmount}
                    onChange={props.handleChange}
                    InputProps={{
                      inputProps: {
                        min: 1,
                        max: checkMaxAmount(props.values.sellMosaicName),
                      },
                    }}
                  />
                </FormControl>
                <FormControl style={{ width: '70%', marginTop: '30px' }}>
                  <InputLabel id="demo-simple-select-label">
                    購入モザイク名
                  </InputLabel>
                  <Select
                    name="buyMosaicName"
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    label="購入モザイク名"
                    value={props.values.buyMosaicName}
                    onChange={props.handleChange}
                  >
                    {mosaicBuyListData}
                  </Select>
                </FormControl>
                <FormControl
                  style={{ width: '28%', marginLeft: '2%', marginTop: '30px' }}
                >
                  <TextField
                    id="outlined-basic"
                    name="buyMosaicAmount"
                    label="購入モザイク量"
                    variant="outlined"
                    type={'number'}
                    value={props.values.buyMosaicAmount}
                    onChange={props.handleChange}
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </FormControl>
                <Button
                  type="submit"
                  style={{ width: '200px', margin: '20px 20px 0px 116px' }}
                  variant="contained"
                  color="success"
                >
                  署名
                </Button>
                <Button
                  type="submit"
                  style={{ width: '200px', margin: '20px 0 0' }}
                  variant="outlined"
                  color="error"
                  onClick={handleClose}
                >
                  キャンセル
                </Button>
              </form>
            )}
          />
        </Box>
      </Modal>
    </Box>
  );
}
