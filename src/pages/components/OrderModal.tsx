import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { FormControl, Typography, Modal, TextField } from '@mui/material';
import { Formik } from 'formik';
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
import { List } from '../../shared/types';
import sym from '../../shared/lib/symbol';
import { getActivePublicKey } from 'sss-module';
export default function OrderModal(props: any) {
  const handleClose = () => props.setShowModal(false);
  const list: List = props.order;
  return (
    <Box style={{ margin: '50px 0' }}>
      <Modal
        open={props.showFlag}
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
            取引
          </Typography>
          <Formik
            initialValues={{
              sellMosaicName: '',
              sellMosaicAmount: 0,
              buyMosaicName: '',
              buyMosaicAmount: 0,
            }}
            onSubmit={async () => {
              const result = await sym.createBuyTransaction(
                list.id,
                getActivePublicKey(),
              );
              console.log(result);
              handleClose();
            }}
          >
            {(props: any) => (
              <form onSubmit={props.handleSubmit}>
                <FormControl style={{ width: '70%' }}>
                  <TextField
                    id="outlined-basic"
                    label="提供モザイク名"
                    variant="outlined"
                    type={'text'}
                    value={list.buyMosaicName}
                    disabled
                  />
                </FormControl>
                <FormControl style={{ width: '28%', marginLeft: '2%' }}>
                  <TextField
                    id="outlined-basic"
                    label="提供モザイク量"
                    variant="outlined"
                    type={'number'}
                    value={list.buyMosaicAmount}
                    disabled
                  />
                </FormControl>
                <FormControl style={{ width: '70%', marginTop: '30px' }}>
                  <TextField
                    id="outlined-basic"
                    label="入手モザイク名"
                    variant="outlined"
                    type={'text'}
                    value={list.sellMosaicName}
                    disabled
                  />
                </FormControl>
                <FormControl
                  style={{
                    width: '28%',
                    marginLeft: '2%',
                    marginTop: '30px',
                  }}
                >
                  <TextField
                    id="outlined-basic"
                    label="入手モザイク量"
                    variant="outlined"
                    type={'number'}
                    value={list.sellMosaicAmount}
                    disabled
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
          </Formik>
        </Box>
      </Modal>
    </Box>
  );
}
