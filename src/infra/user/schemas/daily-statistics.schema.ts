import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'daily_statistics', timestamps: true })
export class DailyStatistics {
    @Prop({ required: true })
    userId: string; 

    @Prop({ required: true })
    date: Date; 

    @Prop({ required: true, default: 0 })
    countQuestionsDone: number; 

    @Prop({ required: true, default: 0 })
    countWrongQuestions: number; 

    @Prop({ required: true, default: 0 })
    currentRanking: number;

    @Prop({ required: true, default: 0 })
    averageTime: number; 
}

export const DailyStatisticsSchema = SchemaFactory.createForClass(DailyStatistics);
