import { Module } from "@nestjs/common";
import FileUploadController from "./file-upload.controller";
import CoreModule from "src/core/core.module";

@Module({
    imports: [FileUploadModule, CoreModule],
    controllers: [FileUploadController],
})
export default class FileUploadModule {}