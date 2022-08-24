import { Controller, Get, Render, Body, Post } from '@nestjs/common';
import { AppService } from './app.service';
import type { SellTransaction, BuyTransaction } from '../shared/types';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Render('index')
  home() {
    return {};
  }

  @Post('/api/create-sell-transaction')
  public async createSellTransaction(@Body() sellTransaction: SellTransaction) {
    try {
      const result = await this.appService.createSellTransaction(
        sellTransaction,
      );
      return result;
    } catch (e: any) {
      throw new Error(e.message);
    }
  }

  @Post('/api/create-buy-transaction')
  public async createBuyTransaction(@Body() hash: string) {
    try {
      const result = await this.appService.createBuyTransaction(hash);
      return result;
    } catch (e: any) {
      throw new Error(e.message);
    }
  }
}
