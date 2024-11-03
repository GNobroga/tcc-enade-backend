import { UseGuards } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import firebaseAdmin from 'firebase-admin';
import { Model } from "mongoose";
import { Server, Socket } from "socket.io";
import FirebaseAuthGuard from "../auth/firebase-auth.guard";
import { UserFriend } from "./schemas/user-friend.schema";
import { SocketUtil } from "./utils/socket.util";
import { UserRecord } from "firebase-admin/lib/auth/user-record";


export type UserFriendOutput = {
    friendId: string;
    friendName: string;
    photoUrl?: string;
    lastRefreshTime?: string;
    status: boolean;
}

export type UserFriendNotificationOutput = {
    id: string;
    userName: string;
    userId: string;
}

@UseGuards(FirebaseAuthGuard)
@WebSocketGateway({ namespace: 'user-notification'})
export default class UserFriendWebsocket implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer()
    server: Server;

    intervalSeconds = 0.2;

    connectedUsers = new Set<string>();

    constructor(
        @InjectModel(UserFriend.name) readonly userFriendModel: Model<UserFriend>,
    ) {}

    async handleDisconnect(socket: Socket) {
        try {
            const { uid } = await SocketUtil.verifyFirebaseToken(socket);
            this.connectedUsers.delete(uid);
        } catch {}
    }

    async handleConnection(socket: Socket) {
        try {
            const { uid } = await SocketUtil.verifyFirebaseToken(socket);
            this.connectedUsers.add(uid);
        } catch {
            socket.disconnect(true);
        }
    }

    private delay(seconds: number) {
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }

    @SubscribeMessage('list-friend-notifications')
    async listFriendNotifications(@ConnectedSocket() socket: Socket) {
        while (true) {
            const pendingUserFriends = await this.userFriendModel.find({
                friendId: socket.user.uid,
                status: 'pending',
            });

            const users = new Map<string, UserRecord>();

            await Promise.all(pendingUserFriends.map(async ({ requestedBy }) => {
                const user = await firebaseAdmin.auth().getUser(requestedBy);
                if (!users.has(requestedBy)) {
                    users.set(requestedBy, user);
                }
            }));

            const pendingUserFriendsOutputs = pendingUserFriends.map(({ requestedBy: userId, _id: id }) => {
                return {
                    id,
                    userId,
                    userName: users.get(userId).displayName,
                } as UserFriendNotificationOutput;
            });

            socket.emit('receive-friend-notification', pendingUserFriendsOutputs);

            await this.delay(this.intervalSeconds)
        }
    }

    @SubscribeMessage('list-friends')
    async listFriends(@ConnectedSocket() socket: Socket) {
        while(true) {   
            const data = await this.userFriendModel.find({
                $or: [
                    { userId: socket.user.uid },
                    { friendId: socket.user.uid },
                ],
                status: 'accepted',
            });
            
            const auth = firebaseAdmin.auth();
            
            const results = data.map(async ({ userId, friendId }) => {
                friendId = userId === socket.user.uid ? friendId : userId;
                const { displayName: friendName, ...rest} = await auth.getUser(friendId);
                return {
                    friendId,
                    friendName,
                    lastRefreshTime: rest.metadata.lastRefreshTime,
                    status: this.connectedUsers.has(friendId),
                    photoUrl: rest.photoURL,
                } as UserFriendOutput;
            });
            
            socket.emit('list-friends', await Promise.all(results));
            await this.delay(this.intervalSeconds);
        }
    }
}