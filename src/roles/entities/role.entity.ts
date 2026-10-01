import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  idRol: number;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
  })
  nombre: string;
}