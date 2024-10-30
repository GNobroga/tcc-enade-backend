import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import AchievementController from './controllers/achievement.controller';
import { UserController } from './controllers/user.controller';
import { Achievement, AchievementSchema } from './schemas/achievement.schema';
import { UserAchievement, UserAchievementSchema } from './schemas/user-achievement.schema';
import AchievementService from './services/achievement.service';
import UserService from './services/user.service';
import { DailyStatistics, DailyStatisticsSchema } from './schemas/daily-statistics.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Achievement.name, schema: AchievementSchema },
      { name: UserAchievement.name, schema: UserAchievementSchema, },
      { name: DailyStatistics.name, schema: DailyStatisticsSchema, },
    ])
  ],
  controllers: [UserController, AchievementController],
  providers: [AchievementService, UserService],
})
export class UserModule {}
