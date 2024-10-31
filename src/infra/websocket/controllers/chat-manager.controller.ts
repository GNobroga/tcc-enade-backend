import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import FirebaseAuthGuard from "src/infra/auth/firebase-auth.guard";
import { CurrentUser } from "src/infra/auth/user-details.decorator";
import { Chat } from "src/infra/websocket/schemas/chat.schema";
import firebaseAdmin from 'firebase-admin';

@UseGuards(FirebaseAuthGuard)
@Controller({ path: 'chat-manager', version: '1', })
export default class ChatManagerController {

    constructor(
        @InjectModel(Chat.name) readonly chatModel: Model<Chat>, 
    ) {}

    @Post('create-private')
    async createPrivateChat(@CurrentUser('uid') participantOneId: string, @Body() { participantTwoId }: { participantTwoId: string }) {
        let chat = await this.chatModel.findOne({
            $or: [
                { participantOneId, participantTwoId },
                { participantOneId: participantTwoId, participantTwoId: participantOneId}
            ]
        });

        if (chat) return { roomId: chat._id.toString() };

        chat = await this.chatModel.create({
            participantOneId,
            participantTwoId,
            messages: [],
        });

        return { roomId: chat._id.toString() };
    }

    @Get('list-private')
    async listPrivateChat(@CurrentUser('uid') userId: string) {
        const chats = await this.chatModel.find({ 
            $or: [
                { participantOneId: userId },
                { participantTwoId: userId },
            ],
        });

        const promises = chats.map(async doc => {
            const participantTwoId = doc.participantOneId === userId ? doc.participantTwoId : doc.participantOneId;
            const participantTwo = await firebaseAdmin.auth().getUser(participantTwoId);
            return {
                roomId: doc._id,
                participantTwo,
                messages: doc.messages,
            };
        })

        return await Promise.all(promises);
    }

    @Get('messages-from-private/:roomId')
    async listMessagesFromPrivateChat(@CurrentUser('uid') userId: string, @Param('roomId') roomId: string) {
        const chat = await this.chatModel.findById(roomId);

        if (!chat) return [];

        const messages = chat.messages.map(async message => {
            const user = await firebaseAdmin.auth().getUser(message.senderId);
            return {
                fromId: user.uid,
                displayName: user.displayName,
                message: message.text,
                sentAt: message.sentAt,
            }
        });

        return await Promise.all(messages);
    }

}