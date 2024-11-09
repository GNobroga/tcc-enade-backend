import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Achievement } from './achievement.schema';

@Schema({ collection: 'user_achievements', timestamps: true })
export class UserAchievement {

    @Prop({ required: true })  
    ownerId: string;

    @Prop({ ref: Achievement.name, required: true })  
    achievementId: string;

    createdAt: Date;
}

export const UserAchievementSchema = SchemaFactory.createForClass(UserAchievement);
