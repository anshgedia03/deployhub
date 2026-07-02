import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import type { AuthenticatedRequest } from 'src/common/interfaces';

@Controller('project')
@UseGuards(JwtAuthGuard)
@Throttle({
  default: {
    limit: 50,
    ttl: 30000,
  },
})
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectService.create(createProjectDto, req.user.sub);
  }

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('search') search?: string,
    @Query('sort') sort?: 'asc' | 'desc',
  ) {
    return this.projectService.findAll(req.user.sub, search, sort);
  }

  @Post(':id/duplicate')
  duplicateProject(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.projectService.duplicateProject(id, req.user.sub);
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.projectService.findOne(id, req.user.sub);
  }

  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectService.update(id, updateProjectDto, req.user.sub);
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.projectService.remove(id, req.user.sub);
  }
}
