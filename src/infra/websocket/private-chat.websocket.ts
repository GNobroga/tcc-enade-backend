import { UseGuards } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Model } from "mongoose";
import { Server, Socket } from "socket.io";
import FirebaseAuthGuard from "../auth/firebase-auth.guard";
import { Chat } from "./schemas/chat.schema";
import { SocketUtil } from "./utils/socket.util";

type SendMessagePayload = {
    roomId: string;
    message: string;
}

export type ChatMessage = {
    fromId: string;
    displayName: string;
    message: string;
    photoUrl: string;
    sentAt: Date;
}

@UseGuards(FirebaseAuthGuard)
@WebSocketGateway({ namespace: 'private-chat' })
export default class PrivateChatWebsocket implements OnGatewayConnection, OnGatewayDisconnect {
    
    @WebSocketServer()
    server: Server;
    
    constructor(
        @InjectModel(Chat.name) readonly chatModel: Model<Chat>
    ) {}

    connectedUsers = new Map<string, Socket>();
    
    async handleDisconnect(socket: Socket) {
        try {
            const { uid } = await SocketUtil.verifyFirebaseToken(socket);
            this.connectedUsers.delete(uid);
        } catch {}
    }

    async handleConnection(socket: Socket) {
       try {
            const { uid } = await SocketUtil.verifyFirebaseToken(socket);
            this.connectedUsers.set(uid, socket);
       } catch {
            socket.disconnect(true);
       }
    }

    @SubscribeMessage('send-message')
    async sendMessage(@ConnectedSocket() socket: Socket, @MessageBody()  { roomId, message }: SendMessagePayload) {
        const chat = await this.chatModel.findById(roomId);
        
        if (!chat) return;

        const { uid: fromId, displayName } = socket.user;
        
        const messageToSend: ChatMessage = {
            fromId,
            sentAt: new Date(),
            message,
            displayName,
            photoUrl: socket.user.photoURL,
        };

        chat.messages.push({
            senderId: messageToSend.fromId,
            sentAt: messageToSend.sentAt,
            text: messageToSend.message,
        });

        chat.save();

        this.connectedUsers.get(chat.participantOneId)?.join(roomId);
        this.connectedUsers.get(chat.participantTwoId)?.join(roomId);

        this.server.to(roomId).emit('receive-message', messageToSend);
    }
}