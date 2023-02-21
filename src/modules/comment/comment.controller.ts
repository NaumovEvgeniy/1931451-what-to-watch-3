import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { ConfigInterface } from '../../common/config/config.interface.js';
import { Controller } from '../../common/controller/controller.js';
import HttpError from '../../common/errors/http-error.js';
import { LoggerInterface } from '../../common/logger/logger.interface.js';
import { PrivateRouteMiddleware } from '../../common/middlewares/private-route.middlewares.js';
import { ValidateDtoMiddleware } from '../../common/middlewares/validate-dto.middleware.js';
import { Component } from '../../types/component.type.js';
import { HttpMethodEnum } from '../../types/http-method.enum.js';
import { fillDTO } from '../../utils/common.js';
import { FilmServiceInterface } from '../film/film-service.interface.js';
import { CommentServiceInterface } from './comment-service.interface.js';
import CreateCommentDto from './dto/create-comment.dto.js';
import CommentResponse from './response/comment.response.js';

@injectable()
export default class CommentController extends Controller {
  constructor(
    @inject(Component.LoggerInterface) logger: LoggerInterface,
    @inject(Component.ConfigInterface) configService: ConfigInterface,
    @inject(Component.CommentServiceInterface) private readonly commentService: CommentServiceInterface,
    @inject(Component.FilmServiceInterface) private readonly filmService: FilmServiceInterface
  ) {
    super(logger, configService);

    this.logger.info('Register routes for CommentController…');
    this.addRoute({
      path: '/',
      method: HttpMethodEnum.Post,
      handler: this.create,
      middlewares: [
        new PrivateRouteMiddleware(),
        new ValidateDtoMiddleware(CreateCommentDto)
      ]
    });
  }

  public async create(
    req: Request<object, object, CreateCommentDto>,
    res: Response
  ): Promise<void> {
    const {body} = req;

    if (!await this.filmService.exists(body.filmId)) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        `Film with id ${body.filmId} not found.`,
        'CommentController'
      );
    }

    /**
     * TODO: Думаю что неправильно назначать комментарий для пользователя, который присылается в DTO
     * Думаю надо присваивать тому, кто сделал запрос
     */
    const comment = await this.commentService.create({...body, userId: req.user.id});
    this.created(res, fillDTO(CommentResponse, comment));
  }
}
