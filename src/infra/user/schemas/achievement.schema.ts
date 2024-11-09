import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type Goal = {
    description: string;
    count: number;
};

export enum AchievementType {
    SOCIAL = 'social',
    LEARNING = 'learning',
    RANKING = 'ranking',
    NO_ERROR = 'no-error',
    NO_WRONG = 'no-wrong',
    TRIAL_PERIOD = 'trial-period',
    CONSECUTIVE_DAYS = 'consecutive-days',
}

@Schema({ collection: 'achievements', timestamps: true })
export class Achievement {

    @Prop({ required: true })  
    header: string;

    @Prop({ required: true }) 
    detail: string;

    @Prop({ required: true })  
    imageUrl: string;

    @Prop({ required: true })
    type: string;

    @Prop({ type: Number, default: 1 })
    goal: number;

    createdAt?: Date;
}

export const AchievementSchema = SchemaFactory.createForClass(Achievement)

