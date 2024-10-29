import { Module } from "@nestjs/common";
import GlobalChatWebSocket from "./global-chat.websocket";

@Module({
    providers: [GlobalChatWebSocket],
    exports: [GlobalChatWebSocket],
})
export default class WebSocketModule {}