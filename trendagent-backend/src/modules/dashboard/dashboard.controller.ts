import {
  Controller,
  Get,
  HttpException,
  Param,
  Patch,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import type { AuthenticatedRequest } from 'src/common/interfaces';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@Throttle({
  default: {
    limit: 40,
    ttl: 30000,
  },
})
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /*
  |--------------------------------------------------------------------------
  | GET ALL WIDGETS
  |--------------------------------------------------------------------------
  | Returns all dashboard-pinned widgets for the given chat session after
  | project ownership and chat-session access are validated by the backend.
  |---------------------------------------------------------------------------
  */
  @Get('project/:projectId/chatsession/:chatsessionId/getWidgets')
  async getWidgets(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Param('projectId') projectId: string,
    @Param('chatsessionId') chatSessionId: string,
  ) {
    try {
      const data = await this.dashboardService.getWidgets(
        projectId,
        chatSessionId,
        req.user.sub,
      );

      res.status(200).json({
        success: true,
        data,
      });
      return;
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.getStatus()).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard widgets',
      });
      return;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | ADD WIDGET TO DASHBOARD
  |--------------------------------------------------------------------------
  | Marks a specific chat message widget as visible on the dashboard for the
  | authenticated user within the given project and chat session.
  |---------------------------------------------------------------------------
  */
  @Patch(
    'project/:projectId/chatsession/:chatsessionId/messages/:messageId/addWidget',
  )
  async markWidgetOnDashboard(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Param('projectId') projectId: string,
    @Param('chatsessionId') chatSessionId: string,
    @Param('messageId') messageId: string,
  ) {
    try {
      const result = await this.dashboardService.markWidgetOnDashboard(
        projectId,
        chatSessionId,
        messageId,
        req.user.sub,
      );

      res.status(200).json(result);
      return;
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.getStatus()).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to add widget to dashboard',
      });
      return;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | REMOVE WIDGET FROM DASHBOARD
  |--------------------------------------------------------------------------
  | Removes the dashboard flag from a specific widget message after verifying
  | the requested project, chat session, and message relationship.
  |---------------------------------------------------------------------------
  */
  @Patch(
    'project/:projectId/chatsession/:chatsessionId/messages/:messageId/removeWidget',
  )
  async removeWidgetFromDashboard(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Param('projectId') projectId: string,
    @Param('chatsessionId') chatSessionId: string,
    @Param('messageId') messageId: string,
  ) {
    try {
      const result = await this.dashboardService.removeWidgetFromDashboard(
        projectId,
        chatSessionId,
        messageId,
        req.user.sub,
      );

      res.status(200).json(result);
      return;
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.getStatus()).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to remove widget from dashboard',
      });
      return;
    }
  }
}
