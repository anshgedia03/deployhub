import { Injectable } from '@nestjs/common';
import cloudinary from 'src/config/cloudinary.config';

@Injectable()
export class CloudinaryService {
  async uploadRawFile(path: string) {
    return cloudinary.uploader.upload(path, {
      resource_type: 'raw',
      access_mode: 'public',
    });
  }

  async deleteRawFile(publicId: string) {
    return cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw',
    });
  }
}
