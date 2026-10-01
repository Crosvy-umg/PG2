import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  titulo: string;

  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  impacto: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  urgencia: string;

  @IsInt()
  @Min(1)
  idCategoria: number;
}