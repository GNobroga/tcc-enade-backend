// import { InjectModel } from "@nestjs/mongoose";
// import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway } from "@nestjs/websockets";
// import { Chat } from "./schemas/chat.schema";
// import { Model } from "mongoose";

// @WebSocketGateway({ namespace: 'private-chat' })
// export default class PrivateChatWebsocket implements OnGatewayConnection, OnGatewayDisconnect {
    
//     constructor(@InjectModel(Chat.name) readonly chat: Model<Chat>) {}
    
//     handleDisconnect(client: any) {
//     }
//     handleConnection(client: any, ...args: any[]) {
//     }
   
    

//     /*
//         Fluxo
//             Um usuário manda mensagem para outro
//             Salva mensagem no banco para que fique salva.
//             Ao inicializar as mensagens serão enviadas.

//     */

// }