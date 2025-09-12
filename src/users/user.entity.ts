import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn} from "typeorm";

@Entity()
export class User{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({unique:true})
    email: string;

    @Column()
    name: string;

    @Column()
    password: string;

    @Column({default: 'user'}) // roles: admin, contador, usuario, etc.
    role: string;

    @CreateDateColumn()
    created_at: Date;
}