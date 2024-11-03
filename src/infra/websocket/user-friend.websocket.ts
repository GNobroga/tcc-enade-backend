import { InjectModel } from "@nestjs/mongoose";
import { ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Model } from "mongoose";
import { Server, Socket } from "socket.io";
import { UserFriend } from "./schemas/user-friend.schema";
import { SocketUtil } from "./utils/socket.util";
import firebaseAdmin from 'firebase-admin';

@WebSocketGateway({ namespace: 'user-notification'})
export default class UserFriendWebsocket implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer()
    server: Server;

    intervalSeconds = 0.2;

    connectedUsers = new Set<string>();

    constructor(
        @InjectModel(UserFriend.name) readonly userFriendModel: Model<UserFriend>,
    ) {}

    async handleDisconnect(client: Socket) {
       await SocketUtil.extractTokenFromSocketAndVerify(client);
       if (!client.user) return;
       const userId = client.user.uid;
       if (!this.connectedUsers.has(userId)) return;
       this.connectedUsers.delete(userId);
    }

    async handleConnection(client: Socket) {
        await SocketUtil.extractTokenFromSocketAndVerify(client);
        if (!client.user) return;
        const userId = client.user.uid;
        this.connectedUsers.add(userId);
    }

    private delay(seconds: number) {
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }

    @SubscribeMessage('list-friend-notifications')
    async listFriendNotifications(@ConnectedSocket() client: Socket) {
        await SocketUtil.extractTokenFromSocketAndVerify(client);
        const userId = client.user.uid;
        while (true) {
            const pendingUserFriends = await this.userFriendModel.find({
                friendId: userId,
                status: 'pending',
            });

            const pendingUserFriendsConverted = [] as any[];

            for (const { requestedBy, _id: id } of pendingUserFriends) {
                const user = await firebaseAdmin.auth().getUser(requestedBy);
                pendingUserFriendsConverted.push({
                    id,
                    userName: user.displayName,
                    userId: requestedBy,
                });
            }

            client.emit('receive-friend-notification', pendingUserFriendsConverted);

            await this.delay(this.intervalSeconds)
        }
    }

    @SubscribeMessage('list-friends')
    async listFriends(@ConnectedSocket() socket: Socket) {
        await SocketUtil.extractTokenFromSocketAndVerify(socket);
        while(true) {
            
            const data = await this.userFriendModel.find({
                $or: [
                    { userId: socket.user.uid },
                    { friendId: socket.user.uid },
                ],
                status: 'accepted',
            });
            
            const auth = firebaseAdmin.auth();
            
            const results = [];
    
            for (const { userId, friendId } of data) {
                let id = userId;
                if (id === socket.user.uid) {
                    id = friendId;
                }

                const friend = await auth.getUser(id);

                results.push({
                    friendId: id,
                    friendName: friend.displayName,
                    photoUrl: friend.photoURL,
                    lastRefreshTime: friend.metadata.lastRefreshTime,
                    status: this.connectedUsers.has(friend.uid),
                })
            }
            
            socket.emit('list-friends', results);
            await this.delay(this.intervalSeconds);

        }
    }
}