import {
  IsInt,
  Min,
} from 'class-validator';

export class UpdateAtencionTicketDto {
  @IsInt()
  @Min(1)
  idTecnico: number;

  @IsInt()
  @Min(1)
  idPrioridad: number;

  @IsInt()
  @Min(1)
  idEstado: number;
}