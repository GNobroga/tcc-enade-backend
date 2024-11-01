import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { SocketUtil } from "./utils/socket.util";

@WebSocketGateway({ namespace: 'global-chat', cors: true })
export default class GlobalChatWebSocket implements OnGatewayConnection, OnGatewayDisconnect  {

    @WebSocketServer()
    server: Server;

    connectedUsers = new Map<string, Socket>();

    async handleConnection(client: Socket) {
        const decodedToken = await SocketUtil.extractTokenFromSocketAndVerify(client);
        if (!decodedToken) return;  
        this.connectedUsers.set(decodedToken.uid, client);
    }

    handleDisconnect(client: Socket) {  
        if (!client?.user) return;
        const { uid } = client.user; 
        this.connectedUsers.delete(uid); 
    }

    @SubscribeMessage('send-message')
    sendMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: string) {
        const sockets = Array.from(this.connectedUsers.values());
        sockets.forEach(socket => socket.emit('receive-message',{
            fromId: client.user?.uid,
            displayName: client.user.displayName,
            message: payload,
            photoUrl: socket.user.photoURL,
            sentAt: new Date(),
        }));
    }

}