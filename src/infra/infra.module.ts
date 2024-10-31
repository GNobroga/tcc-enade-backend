import { Module } from "@nestjs/common";
import { NotepadModule } from "./notepad/notepad.module";
import { UserModule } from './user/user.module';
import WebSocketModule from "./websocket/websocket.module";
import FileUploadModule from "./file-upload/file-upload.module";

@Module({
    imports: [NotepadModule, WebSocketModule, UserModule, FileUploadModule],
    exports: [],
})
export default class InfraModule {}