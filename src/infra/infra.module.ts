import { Module } from "@nestjs/common";
import { NotepadModule } from "./notepad/notepad.module";
import WebSocketModule from "./websocket/websocket.module";

@Module({
    imports: [NotepadModule, WebSocketModule],
    exports: []
})
export default class InfraModule {}