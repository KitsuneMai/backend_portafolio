import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Product } from 'src/products/entities/product.entity';
import { ProductsModule } from 'src/products/products.module';
import { User } from 'src/users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, SaleItem, Product, User]), ProductsModule],
  providers: [SalesService],
  controllers: [SalesController],
})
export class SalesModule {}
