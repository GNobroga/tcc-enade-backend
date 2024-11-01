import { InjectModel } from "@nestjs/mongoose";
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Model } from "mongoose";
import { Server, Socket } from "socket.io";
import { UserFriend } from "./schemas/user-friend.schema";
import { SocketUtil } from "./utils/socket.util";
import firebaseAdmin from 'firebase-admin';

@WebSocketGateway({ namespace: 'user-notification'})
export default class UserFriendWebsocket implements OnGatewayConnection {

    @WebSocketServer()
    server: Server;

    intervalSeconds = 1000;

    constructor(
        @InjectModel(UserFriend.name) readonly userFriendModel: Model<UserFriend>,
    ) {}

    async handleConnection(client: Socket) {
        await SocketUtil.extractTokenFromSocketAndVerify(client);
        const userId = client.user.uid;
        while (true) {
            const pendingUserFriends = await this.userFriendModel.find({
                friendId: userId,
                status: 'pending',
            });

            const pendingUserFriendsConverted = [] as any[];

            for (const { requestedBy } of pendingUserFriends) {
                const user = await firebaseAdmin.auth().getUser(requestedBy);
                pendingUserFriendsConverted.push({
                    userName: user.displayName,
                    userId: requestedBy,
                });
            }

            client.emit('receive-friend-notification', pendingUserFriendsConverted);

            await this.delay(this.intervalSeconds)
        }
    }

    private delay(seconds: number) {
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }
}