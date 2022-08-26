import { Controller, Get, Render, Body, Post } from '@nestjs/common';
import { AppService } from './app.service';
import type { BuyTransaction, AggTransaction } from '../shared/types';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Render('index')
  home() {
    return {};
  }

  @Post('/api/create-aggregate-buy-transaction')
  public async createAggregateBuyTransaction(
    @Body() aggTransaction: AggTransaction,
  ) {
    try {
      const result = await this.appService.createAggregateBuyTransaction(
        aggTransaction.hash,
        aggTransaction.publicKey,
      );
      return result;
    } catch (e: any) {
      throw new Error(e.message);
    }
  }

  @Post('/api/create-cosignature-transaction')
  public async createCosignatureTransaction(
    @Body() buyTransaction: BuyTransaction,
  ) {
    try {
      const result = this.appService.createCosignatureTransaction({
        payload: buyTransaction.payload,
      });
      return result;
    } catch (e: any) {
      throw new Error(e.message);
    }
  }

  @Get('/api/watch')
  public async watchTransaction() {
    try {
      const result = await this.appService.watchTransaction();
      return result;
    } catch (e: any) {
      throw new Error(e.message);
    }
  }
}
