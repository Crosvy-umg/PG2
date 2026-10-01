import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateEstadoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nombre: string;
}