import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany} from "typeorm";
import { Sale } from "src/sales/entities/sale.entity";
import { Exclude } from "class-transformer";

@Entity()
export class User{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({unique:true})
    email: string;

    @Column()
    name: string;

    @Column()
    @Exclude()
    password: string;

    @OneToMany(() => Sale, (sale) => sale.user)
    sales: Sale[];


    @Column({default: 'user'}) 
    role: string;

    @CreateDateColumn()
    created_at: Date;
}