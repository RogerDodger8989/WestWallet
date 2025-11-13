import { Controller, Post, UploadedFile, UseInterceptors, Delete, Param, Inject } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

@Controller('uploads')
export class UploadsController {
  constructor(@Inject('WsGateway') private readonly wsGateway: any) {}
  @Post(':id')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads', req.params.id);
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        cb(null, file.originalname);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }))
  uploadFile(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    // WebSocket: skicka event till alla klienter
    this.wsGateway?.sendEvent('fileUploaded', { id, filename: file.filename });
    return { success: true, filename: file.filename };
  }

  @Delete(':id/:filename')
  deleteFile(@Param('id') id: string, @Param('filename') filename: string) {
    const filePath = path.join(__dirname, '../../uploads', id, filename);
    if (fs.existsSync(filePath)) {
      // WebSocket: skicka event till alla klienter
      this.wsGateway?.sendEvent('fileDeleted', { id, filename });
      fs.unlinkSync(filePath);
      return { success: true };
    }
    return { success: false, message: 'File not found' };
  }
}
