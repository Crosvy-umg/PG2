import {
    BadRequestException,
    Injectable,
  } from '@nestjs/common';
  
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import * as bcrypt from 'bcrypt';
  
  import { User } from './entities/user.entity';
  import { CreateUserDto } from './dto/create-user.dto';
  
  @Injectable()
  export class UsersService {
  
    constructor(
      @InjectRepository(User)
      private readonly userRepository: Repository<User>,
    ) {}
  
    async create(createUserDto: CreateUserDto) {
  
      const usuarioExistente = await this.userRepository.findOne({
        where: {
          usuario: createUserDto.usuario,
        },
      });
  
      if (usuarioExistente) {
        throw new BadRequestException('El usuario ya existe');
      }
  
      const contraseniaCifrada = await bcrypt.hash(
        createUserDto.contrasenia,
        10,
      );
  
      const nuevoUsuario = this.userRepository.create({
        usuario: createUserDto.usuario,
        contrasenia: contraseniaCifrada,
      });
  
      const usuarioGuardado =
        await this.userRepository.save(nuevoUsuario);
  
      return {
        id: usuarioGuardado.id,
        usuario: usuarioGuardado.usuario,
        activo: usuarioGuardado.activo,
        fechaCreacion: usuarioGuardado.fechaCreacion,
      };
    }
  
    async findAll() {
      return this.userRepository.find({
        select: {
          id: true,
          usuario: true,
          activo: true,
          fechaCreacion: true,
        },
      });
    }
  
    async findByUsername(usuario: string) {
      return this.userRepository.findOne({
        where: {
          usuario,
        },
      });
    }
  }