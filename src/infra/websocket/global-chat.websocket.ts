import { UseGuards } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import FirebaseAuthGuard from "../auth/firebase-auth.guard";

@UseGuards(FirebaseAuthGuard)
@WebSocketGateway({ namespace: 'global-chat'})
export default class GlobalChatWebSocket implements OnGatewayConnection, OnGatewayDisconnect  {

    @WebSocketServer()
    server: Server;

    connectedUsers = new Map<string, Socket>();

    handleConnection(client: Socket) {
        this.connectedUsers.set(client.user.uid, client);
    }

    handleDisconnect(client: Socket) {  
        this.connectedUsers.delete(client.user.uid);
    }

    @SubscribeMessage('send-message')
    sendMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: string) {
        const sockets = Array.from(this.connectedUsers.values());
        sockets.forEach(socket => socket.send({
            from: client.user.email,
            message: payload,
        }));
    }

}