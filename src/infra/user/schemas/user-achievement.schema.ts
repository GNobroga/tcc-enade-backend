import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Achievement } from './achievement.schema';

@Schema({ collection: 'user_achievements', timestamps: true })
export class UserAchievement {

    @Prop({ required: true })  
    userId: string;

    @Prop({ type: Types.ObjectId, ref: Achievement.name, required: true })  
    achievementId: Types.ObjectId;
}

export const UserAchievementSchema = SchemaFactory.createForClass(UserAchievement);
