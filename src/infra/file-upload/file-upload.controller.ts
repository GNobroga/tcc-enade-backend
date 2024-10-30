import { Controller, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { resolve } from "path";
import AppConfig from "src/core/app-config";

@Controller({ path: 'file-upload', version: '1'})
export default class FileUploadController {

    constructor(
        readonly appConfig: AppConfig,
    ) {}

    @Post()
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: resolve('public'),
            filename(req, file, callback) {
                callback(null, file.originalname);
            },
        }),
        limits: {
            fileSize: 10 * (1024 ** 2),
        }
    }))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        const originalname = file.originalname;
        return {
            imageUrl: `http://${this.appConfig.host}:${this.appConfig.port}/static/${originalname}`,
        }
    }

}