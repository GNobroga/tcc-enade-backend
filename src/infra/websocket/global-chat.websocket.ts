import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import UserDetails from "../auth/user-details";
import { SocketUtil } from "./utils/socket.util";

@WebSocketGateway({ namespace: 'global-chat', cors: true })
export default class GlobalChatWebSocket implements OnGatewayConnection, OnGatewayDisconnect  {

    @WebSocketServer()
    server: Server;

    connectedUsers = new Map<string, Socket>();

    async handleConnection(client: Socket) {
        console.log('oi')
       try {
            const token = SocketUtil.extractTokenFromSocket(client);
            const { uid, email } = await SocketUtil.verifyFirebaseToken(token);
            client['user'] = new UserDetails(uid, email);
            this.connectedUsers.set(uid, client);
       } catch (error) {
            console.error(error);
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
        console.log(client.user);
        const sockets = Array.from(this.connectedUsers.values());
        sockets.forEach(socket => socket.emit('receive-message',{
            from: client.user.email,
            message: payload,
        }));
    }

}