import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SaleItem } from './sale-item.entity';
import { User } from 'src/users/user.entity';

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  date: Date;

  @ManyToOne(() => User, (user) => user.sales, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  customerName?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 10, scale: 2 })
  ivaTotal: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @OneToMany(() => SaleItem, (item) => item.sale)
  items: SaleItem[];
}
