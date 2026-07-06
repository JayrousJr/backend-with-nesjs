/// <reference types="multer" />
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '@common';
import type { CurrentUser } from '@common';
import { StorageService } from './storage.service';
import { MAX_FILE_SIZE, MAX_BULK_FILES } from './storage.constants';

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder: string,
    @AuthUser() user: CurrentUser,
  ) {
    const data = await this.storageService.upload(
      file,
      folder || 'general',
      user.id,
    );
    return { data, message: 'File uploaded successfully' };
  }

  @Post('upload-many')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', MAX_BULK_FILES, {
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadMany(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder: string,
    @AuthUser() user: CurrentUser,
  ) {
    const data = await this.storageService.uploadMany(
      files,
      folder || 'general',
      user.id,
    );
    return { data, message: `${data.length} file(s) uploaded successfully` };
  }

  @Get('download/*path')
  download(@Param('path') path: string) {
    return this.storageService.getFileStream(path.replaceAll(',', '/'));
  }
}
