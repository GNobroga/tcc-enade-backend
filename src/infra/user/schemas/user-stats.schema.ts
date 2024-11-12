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
    score: number; 

    @Prop({ default: 0})
    averageResponseTime: number; 

    @Prop({ default: 0 })
    countFriends: number;
    
    @Prop({ default: true })
    canAccessRandomQuestion: boolean;

    @Prop({ default: 3 })
    dailyHintCount: number;

    @Prop({ default: true })
    trialPeriod: boolean;

    @Prop({ type: Map, of: Number, default: {} })
    correctAnswersByCategory: Map<string, number>; 
}

export const UserStatsSchema = SchemaFactory.createForClass(UserStats);
