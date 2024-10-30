import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

type Message = { 
    senderId: string;
    text: string;
    sentAt: Date;
}

@Schema({ collection: 'chats', timestamps: true })
export class Chat extends Document {

  @Prop({ required: true }) 
  participantOneId: string;

  @Prop({ required: true })
  participantTwoId: string;

  @Prop({ default: false }) 
  isChatHiddenForParticipantOne: boolean;

  @Prop({ default: false }) 
  isChatHiddenForParticipantTwo: boolean;

  @Prop({ type: [{ senderId: String, text: String, sentAt: Date }], default: [] })
  messages: Message[];
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
