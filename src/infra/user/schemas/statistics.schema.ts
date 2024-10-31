import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'statistics', timestamps: true })
export class Statistics {
    @Prop({ required: true })
    userId: string; 

    @Prop({ required: true, default: 0 })
    countQuestionsDone: number; 

    @Prop({ required: true, default: 0 })
    countWrongQuestions: number; 

    @Prop({ required: true, default: 0 })
    currentRanking: number;

    @Prop({ required: true, default: 0 })
    averageTime: number;
    
    @Prop({ required: true, default: 0 })
    countFriends: number;
}

export const StatisticsSchema = SchemaFactory.createForClass(Statistics);
