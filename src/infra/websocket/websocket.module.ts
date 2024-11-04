import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import ChatManagerController from "./controllers/chat-manager.controller";
import UserFriendController from "./controllers/user-friend.controller";
import GlobalChatWebSocket from "./global-chat.websocket";
import PrivateChatWebsocket from "./private-chat.websocket";
import { Chat, ChatSchema } from "./schemas/chat.schema";
import { UserFriend, UserFriendSchema } from "./schemas/user-friend.schema";
import UserFriendWebsocket from "./user-friend.websocket";
import { UserModule } from "../user/user.module";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Chat.name, schema: ChatSchema },
            { name: UserFriend.name, schema: UserFriendSchema },
        ]),
        UserModule,
    ],
    providers: [GlobalChatWebSocket, PrivateChatWebsocket, UserFriendWebsocket],
    exports: [],
    controllers: [ChatManagerController, UserFriendController],
})
export default class WebSocketModule {}