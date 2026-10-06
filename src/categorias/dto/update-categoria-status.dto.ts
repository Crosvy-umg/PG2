import { IsBoolean } from 'class-validator';

export class UpdateCategoriaStatusDto {
  @IsBoolean()
  activo: boolean;
}