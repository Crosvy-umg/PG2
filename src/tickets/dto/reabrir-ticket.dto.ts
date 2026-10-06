import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class ReabrirTicketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  motivo: string;
}