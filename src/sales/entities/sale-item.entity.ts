import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from 'src/products/entities/product.entity';
import { Sale } from './sale.entity';

@Entity('sale_items')
export class SaleItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number; // base price

  @Column('decimal', { precision: 5, scale: 2 })
  ivaPercentage: number;

  @Column('decimal', { precision: 10, scale: 2 })
  priceWithIva: number;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number; // quantity * price

  @Column('decimal', { precision: 10, scale: 2 })
  total: number; // quantity * priceWithIva

  @ManyToOne(() => Sale, (sale) => sale.items)
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;
}
