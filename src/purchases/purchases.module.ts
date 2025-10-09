import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { Purchase } from './entities/purchase.entity';
import { PurchaseItem } from './entities/purchase-item.entity';
import { Product } from 'src/products/entities/product.entity';
import { User } from '../users/user.entity';
import { Sale } from 'src/sales/entities/sale.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Purchase, PurchaseItem, Product, User, Sale]),
  ],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
