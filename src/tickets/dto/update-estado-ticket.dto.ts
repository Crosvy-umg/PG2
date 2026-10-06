import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateEstadoTicketDto {
  @IsInt()
  @Min(1)
  idEstado: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolucion?: string;
}