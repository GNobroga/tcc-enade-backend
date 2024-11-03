import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { SocketUtil } from "./utils/socket.util";

@WebSocketGateway({ namespace: 'global-chat', cors: true })
export default class GlobalChatWebSocket implements OnGatewayConnection, OnGatewayDisconnect  {

    @WebSocketServer()
    server: Server;

    connectedUsers = new Map<string, Socket>();

    async handleConnection(socket: Socket) {
        const { uid } = await SocketUtil.verifyFirebaseToken(socket);
        this.connectedUsers.set(uid, socket);
    }

    async handleDisconnect(socket: Socket) {  
        const { uid } = await SocketUtil.verifyFirebaseToken(socket);
        this.connectedUsers.delete(uid); 
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