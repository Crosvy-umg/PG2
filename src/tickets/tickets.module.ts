import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Ticket } from './entities/ticket.entity';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket]),
    AuthModule,
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [
    TicketsService,
    TypeOrmModule,
  ],
})
export class TicketsModule {}