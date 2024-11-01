import { Body, Controller, Get, NotFoundException, Param, Post, UseGuards } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import firebaseAdmin from 'firebase-admin';
import { UserRecord } from "firebase-admin/lib/auth/user-record";
import { Model } from "mongoose";
import FirebaseAuthGuard from "src/infra/auth/firebase-auth.guard";
import { CurrentUser } from "src/infra/auth/user-details.decorator";
import { Chat } from "src/infra/websocket/schemas/chat.schema";

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

        if (chat) {
            chat.isChatHiddenForParticipantOne = false;
            chat.isChatHiddenForParticipantTwo = false;
            await chat.save();
            return { roomId: chat._id.toString() }
        };

        chat = await this.chatModel.create({
            participantOneId,
            participantTwoId,
            messages: [],
        });

        return { roomId: chat._id.toString() };
    }

    @Get('list-private')
    async listPrivateChat(@CurrentUser('uid') userId: string) {
        const chats = (await this.chatModel.find({ 
            $or: [
                { participantOneId: userId },
                { participantTwoId: userId },
            ],
        })).filter(doc => {
            const isParticipantTwo = doc.participantTwoId ===  userId; 
            const isParticipantOne = doc.participantOneId === userId;
            return !((isParticipantTwo && doc.isChatHiddenForParticipantTwo) || (isParticipantOne && doc.isChatHiddenForParticipantOne));
        });

    
        const promises = chats.map(async doc => {
            const isParticipantOne = doc.participantOneId === userId; 
            const participantId = isParticipantOne ? doc.participantTwoId : doc.participantOneId;

            const participant = await firebaseAdmin.auth().getUser(participantId);
            return {
                roomId: doc._id,
                participantTwo: participant,
                messages: doc.messages,
            };
        })

        return await Promise.all(promises);
    }

    @Get('messages-from-private/:roomId')
    async listMessagesFromPrivateChat(@CurrentUser('uid') userId: string, @Param('roomId') roomId: string) {
        const chat = await this.chatModel.findById(roomId);

        if (!chat) return [];

        const users = new Map<string, UserRecord>();
        
        const auth = firebaseAdmin.auth();
        
        for (const { senderId } of chat.messages) {
            if (!users.has(senderId)) users.set(senderId, await auth.getUser(senderId));
        }

        const messages = chat.messages.map(({ senderId, sentAt, text }) => {
            const user = users.get(senderId);
            return {
                fromId: senderId,
                displayName: user.displayName,
                message: text,
                photoUrl: user.photoURL,
                sentAt,
            };
        });
    
        return messages;
    }

    @Get('leave-private-chat/:roomId')
    async leaveUserFromPrivateChat(@CurrentUser('uid') userId: string, @Param('roomId') roomId: string) {
        const chat = await this.chatModel.findById(roomId);

        if (!chat) {
            throw new NotFoundException(`Chat ${roomId} not found`);
        }

        const isParticipantOne = userId === chat.participantOneId;

        if (!isParticipantOne) {
            chat.isChatHiddenForParticipantTwo = true;   
        } else {
            chat.isChatHiddenForParticipantOne = true;
        }

        if (chat.isChatHiddenForParticipantOne && chat.isChatHiddenForParticipantTwo) {
            await this.chatModel.findByIdAndDelete(roomId, { new: true, });
            return {
                leave: true,
            };
        }

        await chat.save();

        return {
            leave: true,
        };
    }
}