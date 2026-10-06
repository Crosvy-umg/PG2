import {
  Module,
} from '@nestjs/common';

import {
  TypeOrmModule,
} from '@nestjs/typeorm';

import {
  AnaliticaController,
} from './analitica.controller';

import {
  AnaliticaService,
} from './analitica.service';

import {
  Ticket,
} from '../tickets/entities/ticket.entity';

import {
  AuthModule,
} from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ticket,
    ]),
    AuthModule,
  ],
  controllers: [
    AnaliticaController,
  ],
  providers: [
    AnaliticaService,
  ],
  exports: [
    AnaliticaService,
  ],
})
export class AnaliticaModule {}