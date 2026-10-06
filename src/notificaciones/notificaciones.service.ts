import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InjectRepository,
} from '@nestjs/typeorm';

import {
  Repository,
} from 'typeorm';

import {
  Notificacion,
} from './entities/notificacion.entity';

@Injectable()
export class NotificacionesService {
  constructor(
    @InjectRepository(
      Notificacion,
    )
    private readonly notificacionRepository:
      Repository<Notificacion>,
  ) {}

  async crear(
    idUsuario: number,
    titulo: string,
    mensaje: string,
    idTicket?: number | null,
  ) {
    const nuevaNotificacion =
      this.notificacionRepository.create({
        idUsuario,
        idTicket: idTicket ?? null,
        titulo,
        mensaje,
        leida: false,
      });

    return this.notificacionRepository.save(
      nuevaNotificacion,
    );
  }

  async findByUsuario(
    idUsuario: number,
  ) {
    return this.notificacionRepository.find({
      where: {
        idUsuario,
      },
      order: {
        fechaCreacion: 'DESC',
      },
    });
  }

  async marcarComoLeida(
    idNotificacion: number,
    idUsuario: number,
  ) {
    const notificacion =
      await this.notificacionRepository.findOne({
        where: {
          idNotificacion,
          idUsuario,
        },
      });

    if (!notificacion) {
      throw new NotFoundException(
        'La notificación no existe',
      );
    }

    notificacion.leida = true;

    return this.notificacionRepository.save(
      notificacion,
    );
  }

  async marcarTodasComoLeidas(
    idUsuario: number,
  ) {
    await this.notificacionRepository.update(
      {
        idUsuario,
        leida: false,
      },
      {
        leida: true,
      },
    );

    return {
      message:
        'Las notificaciones fueron marcadas como leídas',
    };
  }
}