import { api } from '../api';
import { API_METHODS } from '@/constants/api';

export interface Project {
  _id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  sessionsCount?: number;
  __v?: number;
}

export interface CreateProjectDto {
  name: string;
}

export interface UpdateProjectDto {
  name: string;
}

export const projectService = {
  create: (data: CreateProjectDto) =>
    api<CreateProjectDto, Project>({
      method: API_METHODS.POST,
      endpoint: '/project',
      data,
    }),

  findAll: (search?: string, sort?: 'asc' | 'desc') =>
    api<any, Project[]>({
      method: API_METHODS.GET,
      endpoint: '/project',
      queryParams: {
      ...(search && { search }),
      ...(sort && { sort }),
    },
    }),

  findOne: (id: string) =>
    api<any, Project>({
      method: API_METHODS.GET,
      endpoint: `/project/${id}`,
    }),

  update: (id: string, data: UpdateProjectDto) =>
    api<UpdateProjectDto, Project>({
      method: API_METHODS.PATCH,
      endpoint: `/project/${id}`,
      data,
    }),

  delete: (id: string) =>
    api<any, { message: string }>({
      method: API_METHODS.DELETE,
      endpoint: `/project/${id}`,
    }),

  duplicate: (id: string) =>
    api<any, Project>({
      method: API_METHODS.POST,
      endpoint: `/project/${id}/duplicate`,
    }),
};
