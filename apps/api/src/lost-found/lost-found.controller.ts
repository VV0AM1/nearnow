import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { LostFoundService } from './lost-found.service';
import {
  CreateContactRequestDto,
  ReportContactRequestDto,
  RespondContactRequestDto,
} from './dto/lost-found.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class LostFoundController {
  constructor(private readonly lostFound: LostFoundService) {}

  @Get('lost-found/:postId/matches')
  matches(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser() user: User,
  ) {
    return this.lostFound.findMatches(postId, user.id);
  }

  @Delete('lost-found/:postId/matches/:candidateId')
  dismiss(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
    @CurrentUser() user: User,
  ) {
    return this.lostFound.dismissMatch(postId, candidateId, user.id);
  }

  @Post('lost-found/:postId/contact-requests')
  createContact(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser() user: User,
    @Body() body: CreateContactRequestDto,
  ) {
    return this.lostFound.createContactRequest(postId, user.id, body);
  }

  @Get('contact-requests/me')
  myContacts(@CurrentUser() user: User) {
    return this.lostFound.listContactRequests(user.id);
  }

  @Post('contact-requests/:id/respond')
  @HttpCode(200)
  respond(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() body: RespondContactRequestDto,
  ) {
    return this.lostFound.respondToContactRequest(id, user.id, body);
  }

  @Post('contact-requests/:id/report')
  @HttpCode(200)
  report(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() body: ReportContactRequestDto,
  ) {
    return this.lostFound.reportContactRequest(id, user.id, body.details);
  }
}
