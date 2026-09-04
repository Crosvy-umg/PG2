import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
  } from 'typeorm';
  
  @Entity('usuarios')
  export class User {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({
      unique: true,
      length: 100,
    })
    usuario: string;
  
    @Column()
    contrasenia: string;
  
    @Column({
      default: true,
    })
    activo: boolean;
  
    @CreateDateColumn()
    fechaCreacion: Date;
  }