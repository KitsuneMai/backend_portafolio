import { Controller, Post, Body, Get, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req, @Body() dto: CreatePurchaseDto) {
    // Por ahora usamos userId = 1 como ejemplo
    const user = req.user;
    return this.purchasesService.create(dto, user);
  }

  @Get('metrics')
  async getMetrics() {
    return this.purchasesService.getFinancialMetrics();
  }

 
  @Get()
  async findAll() {
    return this.purchasesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.purchasesService.findOne(id);
  }
}
