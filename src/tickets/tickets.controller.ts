import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  Res,
  StreamableFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import {
  FilesInterceptor,
} from '@nestjs/platform-express';

import {
  diskStorage,
} from 'multer';

import {
  extname,
  resolve,
} from 'path';

import {
  createReadStream,
  existsSync,
  mkdirSync,
} from 'fs';

import type {
  Response,
} from 'express';

import { TicketsService } from './tickets.service';

import { AdjuntosTicketService } from './adjuntos-ticket.service';

import { CreateTicketDto } from './dto/create-ticket.dto';

import { UpdateAtencionTicketDto } from './dto/update-atencion-ticket.dto';

import { UpdateEstadoTicketDto } from './dto/update-estado-ticket.dto';

import { ReabrirTicketDto } from './dto/reabrir-ticket.dto';

import { JwtAuthGuard } from '../auth/auth.guard';

import { RolesGuard } from '../auth/roles.guard';

import { Roles } from '../auth/roles.decorator';

const carpetaAdjuntos =
  './uploads/tickets';

if (!existsSync(carpetaAdjuntos)) {
  mkdirSync(
    carpetaAdjuntos,
    {
      recursive: true,
    },
  );
}

@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly ticketsService:
      TicketsService,

    private readonly adjuntosTicketService:
      AdjuntosTicketService,
  ) {}

  /*
   * Crear ticket.
   */
  @Post()
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'Solicitante',
    'Administrador',
  )
  create(
    @Body()
    createTicketDto:
      CreateTicketDto,

    @Req()
    request: any,
  ) {
    return this.ticketsService.create(
      createTicketDto,
      request.user.sub,
    );
  }

  /*
   * Tickets creados por
   * el solicitante autenticado.
   */
  @Get('mis-tickets')
  @UseGuards(JwtAuthGuard)
  findMyTickets(
    @Req()
    request: any,
  ) {
    return this.ticketsService.findBySolicitante(
      request.user.sub,
    );
  }

  /*
   * Tickets asignados al
   * técnico autenticado.
   */
  @Get('asignados')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('Técnico')
  findAssignedTickets(
    @Req()
    request: any,
  ) {
    return this.ticketsService.findByTecnico(
      request.user.sub,
    );
  }

  /*
   * Tickets disponibles para
   * autoasignación del técnico.
   */
  @Get('disponibles')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('Técnico')
  findAvailableTickets() {
    return this.ticketsService.findDisponibles();
  }

  /*
   * Agregar archivos adjuntos.
   */
  @Post(':id/adjuntos')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'Solicitante',
    'Técnico',
    'Supervisor',
    'Administrador',
  )
  @UseInterceptors(
    FilesInterceptor(
      'archivos',
      5,
      {
        storage: diskStorage({
          destination: (
            req,
            file,
            callback,
          ) => {
            callback(
              null,
              carpetaAdjuntos,
            );
          },

          filename: (
            req,
            file,
            callback,
          ) => {
            const extension =
              extname(
                file.originalname,
              ).toLowerCase();

            const nombreArchivo =
              `${Date.now()}-${Math.round(
                Math.random() *
                1000000000,
              )}${extension}`;

            callback(
              null,
              nombreArchivo,
            );
          },
        }),

        limits: {
          fileSize:
            10 * 1024 * 1024,
        },

        fileFilter: (
          req,
          file,
          callback,
        ) => {
          const tiposPermitidos = [
            'image/jpeg',
            'image/png',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          ];

          if (
            !tiposPermitidos.includes(
              file.mimetype,
            )
          ) {
            return callback(
              new BadRequestException(
                'Tipo de archivo no permitido.',
              ),
              false,
            );
          }

          callback(
            null,
            true,
          );
        },
      },
    ),
  )
  agregarAdjuntos(
    @Param(
      'id',
      ParseIntPipe,
    )
    idTicket: number,

    @UploadedFiles()
    archivos:
      Express.Multer.File[],

    @Req()
    request: any,
  ) {
    return this.adjuntosTicketService.guardarAdjuntos(
      idTicket,
      archivos,
      request.user.sub,
      request.user.rol,
    );
  }

  /*
   * Consultar adjuntos.
   */
  @Get(':id/adjuntos')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'Solicitante',
    'Técnico',
    'Supervisor',
    'Administrador',
  )
  listarAdjuntos(
    @Param(
      'id',
      ParseIntPipe,
    )
    idTicket: number,

    @Req()
    request: any,
  ) {
    return this.adjuntosTicketService.listarAdjuntos(
      idTicket,
      request.user.sub,
      request.user.rol,
    );
  }

  /*
   * Abrir o descargar
   * un archivo adjunto.
   */
  @Get(
    ':id/adjuntos/:idAdjunto/archivo',
  )
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'Solicitante',
    'Técnico',
    'Supervisor',
    'Administrador',
  )
  async abrirAdjunto(
    @Param(
      'id',
      ParseIntPipe,
    )
    idTicket: number,

    @Param(
      'idAdjunto',
      ParseIntPipe,
    )
    idAdjunto: number,

    @Req()
    request: any,

    @Res({
      passthrough: true,
    })
    response: Response,
  ) {
    const adjunto =
      await this.adjuntosTicketService.obtenerArchivo(
        idTicket,
        idAdjunto,
        request.user.sub,
        request.user.rol,
      );

    const rutaCompleta =
      resolve(
        process.cwd(),
        adjunto.ruta,
      );

    if (
      !existsSync(
        rutaCompleta,
      )
    ) {
      throw new BadRequestException(
        'El archivo físico no se encuentra disponible.',
      );
    }

    response.set({
      'Content-Type':
        adjunto.tipoMime,

      'Content-Disposition':
        `inline; filename*=UTF-8''${encodeURIComponent(
          adjunto.nombreOriginal,
        )}`,
    });

    const archivo =
      createReadStream(
        rutaCompleta,
      );

    return new StreamableFile(
      archivo,
    );
  }

  /*
   * El técnico autenticado toma
   * un ticket disponible.
   */
  @Patch(':id/asignarme')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('Técnico')
  asignarmeTicket(
    @Param(
      'id',
      ParseIntPipe,
    )
    idTicket: number,

    @Req()
    request: any,
  ) {
    return this.ticketsService.asignarmeTicket(
      idTicket,
      request.user.sub,
    );
  }

  /*
   * Consultar bitácora.
   */
  @Get(':id/bitacora')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'Solicitante',
    'Técnico',
    'Supervisor',
    'Administrador',
  )
  findBitacora(
    @Param(
      'id',
      ParseIntPipe,
    )
    idTicket: number,

    @Req()
    request: any,
  ) {
    return this.ticketsService.findBitacora(
      idTicket,
      request.user.sub,
      request.user.rol,
    );
  }

  /*
   * Consultar detalle.
   */
  @Get(':id')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'Solicitante',
    'Técnico',
    'Supervisor',
    'Administrador',
  )
  findOne(
    @Param(
      'id',
      ParseIntPipe,
    )
    idTicket: number,

    @Req()
    request: any,
  ) {
    return this.ticketsService.findOne(
      idTicket,
      request.user.sub,
      request.user.rol,
    );
  }

  /*
   * Listar todos los tickets.
   */
  @Get()
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'Técnico',
    'Supervisor',
    'Administrador',
  )
  findAll() {
    return this.ticketsService.findAll();
  }

  /*
   * Gestionar atención.
   */
  @Patch(':id/atencion')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'Técnico',
    'Supervisor',
    'Administrador',
  )
  gestionarAtencion(
    @Param(
      'id',
      ParseIntPipe,
    )
    idTicket: number,

    @Body()
    updateAtencionTicketDto:
      UpdateAtencionTicketDto,

    @Req()
    request: any,
  ) {
    return this.ticketsService.gestionarAtencion(
      idTicket,
      updateAtencionTicketDto,
      request.user.sub,
    );
  }

  /*
   * Cambio de estado.
   */
  @Patch(':id/estado')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('Técnico')
  actualizarEstado(
    @Param(
      'id',
      ParseIntPipe,
    )
    idTicket: number,

    @Body()
    updateEstadoTicketDto:
      UpdateEstadoTicketDto,

    @Req()
    request: any,
  ) {
    return this.ticketsService.actualizarEstado(
      idTicket,
      request.user.sub,
      updateEstadoTicketDto,
    );
  }

  /*
   * Confirmar resolución.
   */
  @Patch(
    ':id/confirmar-resolucion',
  )
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('Solicitante')
  confirmarResolucion(
    @Param(
      'id',
      ParseIntPipe,
    )
    idTicket: number,

    @Req()
    request: any,
  ) {
    return this.ticketsService.confirmarResolucion(
      idTicket,
      request.user.sub,
    );
  }

  /*
   * Reabrir ticket.
   */
  @Patch(':id/reabrir')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('Solicitante')
  reabrirTicket(
    @Param(
      'id',
      ParseIntPipe,
    )
    idTicket: number,

    @Body()
    reabrirTicketDto:
      ReabrirTicketDto,

    @Req()
    request: any,
  ) {
    return this.ticketsService.reabrirTicket(
      idTicket,
      request.user.sub,
      reabrirTicketDto,
    );
  }
}