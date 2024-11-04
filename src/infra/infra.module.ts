import { Module } from "@nestjs/common";
import { UserModule } from './user/user.module';
import WebSocketModule from "./websocket/websocket.module";
import FileUploadModule from "./file-upload/file-upload.module";
import { NoteModule } from "./note/note.module";
import QuizModule from "./quiz/quiz.module";

@Module({
    imports: [
        NoteModule, 
        WebSocketModule, 
        UserModule, 
        FileUploadModule, 
        QuizModule
    ],
    exports: [],
})
export default class InfraModule {}