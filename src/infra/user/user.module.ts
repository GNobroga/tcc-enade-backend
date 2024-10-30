import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Achievement, AchievementSchema } from './schemas/achievement.schema';
import { UserAchievement, UserAchievementSchema } from './schemas/user-achievement.schema';
import AchievementController from './controllers/achievement.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Achievement.name, schema: AchievementSchema },
      { name: UserAchievement.name, schema: UserAchievementSchema },
    ])
  ],
  controllers: [UserController, AchievementController],
})
export class UserModule {}
