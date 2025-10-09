import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req, @Body() dto: CreateSaleDto) {
    const user = req.user; // usuario autenticado desde el token 
    return this.salesService.create(dto, user);
  }

  @Get('metrics')
  async getMetrics() {
    return this.salesService.getFinancialMetrics();
  }


  /**
   * Obtener todas las ventas
   */
  @Get()
  async findAll() {
    return this.salesService.findAll();
  }

  /**
   * Obtener una venta específica por ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.salesService.findOne(+id);
  }

  @Get('user-sales') 
  async getUserSales(@Req() req) { 
    const user = req.user; 
    return this.salesService.findSalesByUser(req.user.userId); }
}
