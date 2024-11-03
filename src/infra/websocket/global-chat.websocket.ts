import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { SocketUtil } from "./utils/socket.util";
import { UseGuards } from "@nestjs/common";
import FirebaseAuthGuard from "../auth/firebase-auth.guard";

@UseGuards(FirebaseAuthGuard)
@WebSocketGateway({ namespace: 'global-chat', cors: true })
export default class GlobalChatWebSocket implements OnGatewayConnection, OnGatewayDisconnect  {

    @WebSocketServer()
    server: Server;

    connectedUsers = new Map<string, Socket>();

    async handleConnection(socket: Socket) {
       try {
            const { uid } = await SocketUtil.verifyFirebaseToken(socket);
            this.connectedUsers.set(uid, socket);
       } catch {
            socket.disconnect(true);
       }
    }

    async handleDisconnect(socket: Socket) {  
        try {
            const { uid } = await SocketUtil.verifyFirebaseToken(socket);
            this.connectedUsers.delete(uid); 
        } catch {}
    }

    @SubscribeMessage('send-message')
    sendMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: string) {
        Array.from(this.connectedUsers.values()).forEach(socket => socket.emit('receive-message',{
            fromId: client.user?.uid,
            displayName: client.user.displayName,
            message: payload,
            photoUrl: client.user.photoURL,
            sentAt: new Date(),
        }));
    }

}