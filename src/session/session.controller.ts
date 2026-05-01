import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesEnum } from 'src/user/enums/role.enum';
import type { UserDocument } from 'src/user/user.schema';
import { JoinSessionDto } from './Dto/session-join.dto';
import { SessionRequestDto } from './Dto/session.request.dto';
import { GetMySessionsQueryDto } from './Dto/get-my-sessions.query.dto';
import { SessionService } from './session.service';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { Request } from 'express';

@ApiTags('Sessions')
@Controller('sessions')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @ApiOperation({
    summary: 'Create a new session (Freelancer only)',
    description:
      'Freelancer creates a session and invites a client. A join code is generated that expires in 1 hour.',
  })
  @ApiBody({ type: SessionRequestDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Session created successfully. Join code generated.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid data or user not found',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Client user not found',
  })
  @ApiBearerAuth()
  @Roles([RolesEnum.USER, RolesEnum.FREELANCER]) // USER role is enough, system will add FREELANCER
  @Post()
  async createSession(
    @Body(new ValidationPipe({ transform: true }))
    sessionRequestDto: SessionRequestDto,
    @CurrentUser() currentUser: UserDocument,
  ) {
    const session = await this.sessionService.createFreelancerSession(
      currentUser,
      sessionRequestDto,
    );

    return {
      message: 'Session created successfully',
      session: {
        id: session.id,
        joinCode: session.joinCode,
        joinUrl: session.joinUrl,
        expiresAt: session.joinExpiresAt,
        status: session.status,
        amount: session.amount,
        currency: session.currency,
        deliverableType: session.deliverableType,
        deadline: session.deadline,
      },
    };
  }

  @ApiOperation({
    summary: 'Join a session using join code',
    description:
      'Client joins a session created by freelancer using the 6-digit code. Code expires in 1 hour.',
  })
  @ApiBody({ type: JoinSessionDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully joined session',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid join code or session already joined/expired',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found',
  })
  @ApiBearerAuth()
  @Roles([RolesEnum.USER, RolesEnum.CLIENT])
  @Post('join')
  async joinSession(
    @Body(new ValidationPipe()) joinSessionDto: JoinSessionDto,
    @CurrentUser() currentUser: UserDocument,
  ) {
    const session = await this.sessionService.joinSession(
      currentUser,
      joinSessionDto.joinCode,
    );
    const { user1Email, user2Email } =
      await this.sessionService.getSessionParticipantEmails(session);

    return {
      message: 'Successfully joined session',
      session: {
        id: session.id,
        joinCode: session.joinCode,
        joinUrl: session.joinUrl,
        status: session.status,
        amount: session.amount,
        currency: session.currency,
        title: session.title,
        description: session.description,
        deliverableType: session.deliverableType,
        deadline: session.deadline,
        user1: session.user1,
        user2: session.user2,
        user1Email,
        user2Email,
        joinExpiresAt: session.joinExpiresAt,
        joinedAt: session.joinedAt,
        confirmedAt: session.confirmedAt,
      },
    };
  }

  @ApiOperation({
    summary: 'Get all my sessions',
    description: 'Get all sessions where user is either freelancer or client',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sessions retrieved successfully',
  })
  @ApiBearerAuth()
  @Roles([RolesEnum.USER])
  @Get('my-sessions')
  async getMySessions(
    @CurrentUser() currentUser: UserDocument,
    @Query(new ValidationPipe({ transform: true }))
    query: GetMySessionsQueryDto,
    @Req() request: Request,
  ) {
    const sessions = await this.sessionService.getUserSessions(
      currentUser.id,
      query,
      request,
    );

    return sessions;
  }

  @ApiOperation({
    summary: 'Get session details by join code',
    description:
      'Client previews a session created by freelancer using the join code without changing session state.',
  })
  @ApiParam({
    name: 'joinCode',
    description: 'Session join code',
    example: '123456',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid join code, expired code, or inaccessible session',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found',
  })
  @ApiBearerAuth()
  @Roles([RolesEnum.USER, RolesEnum.CLIENT])
  @Get('by-code/:joinCode')
  async getSessionByJoinCode(
    @Param('joinCode') joinCode: string,
    @CurrentUser() currentUser: UserDocument,
  ) {
    const session = await this.sessionService.getJoinableSessionByCodeForUser(
      joinCode,
      currentUser,
    );
    const { user1Email, user2Email } =
      await this.sessionService.getSessionParticipantEmails(session);

    return {
      session: {
        id: session.id,
        joinCode: session.joinCode,
        joinUrl: session.joinUrl,
        status: session.status,
        amount: session.amount,
        currency: session.currency,
        title: session.title,
        description: session.description,
        deliverableType: session.deliverableType,
        deadline: session.deadline,
        user1: session.user1,
        user2: session.user2,
        user1Email,
        user2Email,
        joinExpiresAt: session.joinExpiresAt,
        joinedAt: session.joinedAt,
        confirmedAt: session.confirmedAt,
      },
    };
  }

  @ApiOperation({
    summary: 'Get session by ID',
    description: 'Get detailed information about a specific session',
  })
  @ApiParam({
    name: 'id',
    description: 'Session ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session found',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'You do not have access to this session',
  })
  @ApiBearerAuth()
  @Roles([RolesEnum.USER])
  @Get(':id')
  async getSessionById(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserDocument,
  ) {
    const session = await this.sessionService.getSessionById(id);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Check if user has access
    const hasAccess = await this.sessionService.validateUserAccess(
      id,
      currentUser.id,
    );

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this session');
    }
    const { user1Email, user2Email } =
      await this.sessionService.getSessionParticipantEmails(session);

    return {
      session: {
        ...session.toObject(),
        user1Email,
        user2Email,
      },
    };
  }

  @ApiOperation({
    summary: 'Regenerate join code',
    description:
      'Regenerate join code if it expired and client has not joined yet',
  })
  @ApiParam({
    name: 'id',
    description: 'Session ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Join code regenerated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot regenerate code for this session status',
  })
  @ApiBearerAuth()
  @Roles([RolesEnum.FREELANCER])
  @Post(':id/regenerate-code')
  async regenerateJoinCode(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserDocument,
  ) {
    const session = await this.sessionService.regenerateJoinCode(
      id,
      currentUser.id,
    );

    return {
      message: 'Join code regenerated successfully',
      session: {
        id: session.id,
        joinCode: session.joinCode,
        joinUrl: session.joinUrl,
        expiresAt: session.joinExpiresAt,
        status: session.status,
      },
    };
  }

  @ApiOperation({
    summary: 'Confirm payment and move funds to escrow',
    description:
      'Client confirms payment. If wallet balance is insufficient, user must add funds.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment confirmed and funds held in escrow',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Insufficient wallet balance or invalid session status',
  })
  @ApiHeader({
    name: 'idempotency-key',
    description: 'Client-generated UUID for safe retry of confirm payment',
    required: true,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBearerAuth()
  @Roles([RolesEnum.CLIENT])
  @Post(':id/confirm-payment')
  async confirmPayment(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserDocument,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ) {
    return this.sessionService.confirmSessionPayment(
      id,
      currentUser,
      idempotencyKey,
    );
  }

  @ApiOperation({
    summary: 'Complete session after all deliverables are approved',
    description:
      'Client completes the project only after every deliverable in the session has been approved.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session completed successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Session is not ready for completion',
  })
  @ApiHeader({
    name: 'idempotency-key',
    description: 'Client-generated UUID for safe retry of complete session',
    required: true,
    example: '0b7c9d5e-0df2-4f86-b7f2-7d5b5d8f1a33',
  })
  @ApiBearerAuth()
  @Roles([RolesEnum.CLIENT])
  @Post(':id/complete')
  async completeSession(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserDocument,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ) {
    return this.sessionService.completeSession(id, currentUser, idempotencyKey);
  }
}
