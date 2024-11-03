import { UseGuards } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import firebaseAdmin from 'firebase-admin';
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
        const { uid } = await SocketUtil.verifyFirebaseToken(socket);
        this.connectedUsers.delete(uid);
    }

    async handleConnection(socket: Socket) {
        const { uid } = await SocketUtil.verifyFirebaseToken(socket);
        this.connectedUsers.set(uid, socket);
    }

    // @SubscribeMessage('list-messages')
    // async listMessages(@MessageBody() roomId: string, @ConnectedSocket() socket: Socket) {
    //     console.log('oi')
    //     const chat = await this.chatModel.findById(roomId);
    //     if (!chat) return;
    //     const auth = firebaseAdmin.auth();
    //     const messages = chat.messages.map(async ({ senderId, text, sentAt }) => {
    //         const sender = await auth.getUser(senderId);
    //         return {
    //             fromId: senderId,
    //             displayName: sender.displayName,
    //             message: text,
    //             photoUrl: sender.photoURL,
    //             sentAt
    //         } as ChatMessage;
    //     });
    //     socket.join(roomId);
    //     this.server.to(roomId).emit('list-messages', await Promise.all(messages));
    // }

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