import {
  IsInt,
  Min,
} from 'class-validator';

export class UpdateEstadoTicketDto {
  @IsInt()
  @Min(1)
  idEstado: number;
}