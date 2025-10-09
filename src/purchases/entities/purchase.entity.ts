// purchase.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from 'src/users/user.entity';
import { PurchaseItem } from './purchase-item.entity';

@Entity()
export class Purchase {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.purchases, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;
  @Column({ nullable: true })
  supplier?: string;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn()
  date: Date;

  @OneToMany(() => PurchaseItem, item => item.purchase, { cascade: true })
  items: PurchaseItem[];
}
 