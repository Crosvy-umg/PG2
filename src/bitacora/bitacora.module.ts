import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BitacoraTicket } from './entities/bitacora-ticket.entity';
import { BitacoraService } from './bitacora.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BitacoraTicket,
    ]),
  ],
  providers: [
    BitacoraService,
  ],
  exports: [
    BitacoraService,
    TypeOrmModule,
  ],
})
export class BitacoraModule {}