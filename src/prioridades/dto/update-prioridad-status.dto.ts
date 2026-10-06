import {
  IsBoolean,
} from 'class-validator';

export class UpdatePrioridadStatusDto {
  @IsBoolean()
  activo: boolean;
}