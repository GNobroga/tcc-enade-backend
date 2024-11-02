import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'user_stats', timestamps: true })
export class UserStats extends Document {

    @Prop({ required:true, type: String })
    ownerId: string;

    @Prop({ default: 0 })
    totalAnsweredQuestions: number;

    @Prop({ default: 0 })
    incorrectAnswersCount: number;

    @Prop({ default: 0 })
    correctAnswersCount: number;

    @Prop({ default: 0 })
    currentUserRanking: number; 

    @Prop({ default: 0})
    averageResponseTime: number; 

    @Prop({ default: 0 })
    countFriends: number; 

    @Prop({ type: Map, of: Number, default: {} })
    correctAnswersByCategory: Map<string, number>; 
}

export const UserStatsSchema = SchemaFactory.createForClass(UserStats);
