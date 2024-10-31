import { Module } from "@nestjs/common";
import GlobalChatWebSocket from "./global-chat.websocket";
import { MongooseModule } from "@nestjs/mongoose";
import { Chat, ChatSchema } from "./schemas/chat.schema";
import { UserFriend, UserFriendSchema } from "./schemas/user-friend.schema";
import ChatManagerController from "./controllers/chat-manager.controller";
import PrivateChatWebsocket from "./private-chat.websocket";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Chat.name, schema: ChatSchema },
            { name: UserFriend.name, schema: UserFriendSchema },
        ]),
    ],
    providers: [GlobalChatWebSocket, PrivateChatWebsocket],
    exports: [GlobalChatWebSocket],
    controllers: [ChatManagerController],
})
export default class WebSocketModule {}