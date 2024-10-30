import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import firebaseAdmin from 'firebase-admin';
import { Server, Socket } from 'socket.io';
import { SocketUtil } from "./utils/socket.util";

@WebSocketGateway({ namespace: 'global-chat', cors: true })
export default class GlobalChatWebSocket implements OnGatewayConnection, OnGatewayDisconnect  {

    @WebSocketServer()
    server: Server;

    connectedUsers = new Map<string, Socket>();

    async handleConnection(client: Socket) {
       try {
            const token = SocketUtil.extractTokenFromSocket(client);
            const { uid } = await SocketUtil.verifyFirebaseToken(token);
            const user = await firebaseAdmin.auth().getUser(uid);
            client['user'] = user;
            this.connectedUsers.set(uid, client);
       } catch (error) {
            client.disconnect();
       }
    }

    handleDisconnect(client: Socket) {  
        if ('user' in client && client.user) {
            this.connectedUsers.delete(client.user.uid);
        }
    }

    @SubscribeMessage('send-message')
    sendMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: string) {
        const sockets = Array.from(this.connectedUsers.values());
        sockets.forEach(socket => socket.emit('receive-message',{
            fromId: client.user?.uid,
            displayName: client.user.displayName,
            message: payload,
            sentAt: new Date(),
        }));
    }

}