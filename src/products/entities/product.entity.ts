import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, AfterLoad } from 'typeorm';
import { VehicleType, PartType } from '../enums/product.enums';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  basePrice: number; // precio antes de IVA

  @Column('decimal', { precision: 5, scale: 2, default: 0, nullable: true })
  ivaPercentage?: number; // IVA en %

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  profitPercentage?: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  stock: number;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ type: 'enum', enum: VehicleType })
  vehicleType: VehicleType;

  @Column({ type: 'enum', enum: PartType })
  partType: PartType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

    priceWithIva?: number;

  @AfterLoad()
  calculatePriceWithIva() {
    const base = Number(this.basePrice);
    const iva = Number(this.ivaPercentage);
    this.priceWithIva = +(base + base * (iva / 100)).toFixed(2);
  }
}
