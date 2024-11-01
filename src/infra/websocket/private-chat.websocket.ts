import { InjectModel } from "@nestjs/mongoose";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Model } from "mongoose";
import { Server, Socket } from "socket.io";
import { Chat } from "./schemas/chat.schema";
import { SocketUtil } from "./utils/socket.util";
import firebaseAdmin from 'firebase-admin';

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

@WebSocketGateway({ namespace: 'private-chat' })
export default class PrivateChatWebsocket implements OnGatewayConnection, OnGatewayDisconnect {
    
    @WebSocketServer()
    server: Server;
    
    constructor(
        @InjectModel(Chat.name) readonly chatModel: Model<Chat>
    ) {}

    connectedUsers = new Map<string, Socket>();
    
    handleDisconnect(client: Socket) {
        if (client?.user) {
            const { uid } = client.user;
            this.connectedUsers.delete(uid);
        }
    }

    async handleConnection(client: Socket) {
        const decodedToken = await SocketUtil.extractTokenFromSocketAndVerify(client);
        if (!decodedToken) return;
        this.connectedUsers.set(decodedToken.uid, client);
    }

    @SubscribeMessage('send-message')
    async sendMessage(@ConnectedSocket() socket: Socket, @MessageBody()  { roomId, message }: SendMessagePayload) {
        await SocketUtil.extractTokenFromSocketAndVerify(socket);
        const chat = await this.chatModel.findById(roomId);
        if (!chat) return;

        chat.messages.push({
            senderId: socket.user.uid,
            sentAt: new Date(),
            text: message,
        });

        await chat.save();

        
        const participantTwoId = socket.user.uid === chat.participantTwoId ? chat.participantOneId : chat.participantTwoId; 
 
        if (this.connectedUsers.has(participantTwoId)) {
            const participantTwoSocket = this.connectedUsers.get(participantTwoId);
            participantTwoSocket.join(roomId);
        }

        socket.join(roomId);

        const messages = [] as ChatMessage[];
        const auth = firebaseAdmin.auth();
        for (const { senderId, text, sentAt } of chat.messages) {
            const user = await auth.getUser(senderId);
            messages.push({
                fromId: senderId,
                displayName: user.displayName,
                message: text,
                photoUrl: user.photoURL,
                sentAt,
            });
        }

        this.server.to(chat._id.toString()).emit('receive-message', messages);
    }
}