import { Module } from "@nestjs/common";
import GlobalChatWebSocket from "./global-chat.websocket";
import { MongooseModule } from "@nestjs/mongoose";
import { Chat, ChatSchema } from "./schemas/chat.schema";
import { UserFriend, UserFriendSchema } from "./schemas/user-friend.schema";
import ChatManagerController from "./controllers/chat-manager.controller";
import PrivateChatWebsocket from "./private-chat.websocket";
import UserFriendController from "./controllers/user-friend.controller";
import UserFriendWebsocket from "./user-friend.websocket";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Chat.name, schema: ChatSchema },
            { name: UserFriend.name, schema: UserFriendSchema },
        ]),
    ],
    providers: [GlobalChatWebSocket, PrivateChatWebsocket, UserFriendWebsocket],
    exports: [],
    controllers: [ChatManagerController, UserFriendController],
})
export default class WebSocketModule {}