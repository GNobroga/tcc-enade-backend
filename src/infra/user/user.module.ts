import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import CoreModule from 'src/core/core.module';
import AchievementController from './controllers/achievement.controller';
import { UserController } from './controllers/user.controller';
import { Achievement, AchievementSchema } from './schemas/achievement.schema';
import { DaySequence, DaySequenceSchema } from './schemas/day-sequence.schema';
import { UserAchievement, UserAchievementSchema } from './schemas/user-achievement.schema';
import { UserStats, UserStatsSchema } from './schemas/user-stats.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Achievement.name, schema: AchievementSchema },
      { name: UserAchievement.name, schema: UserAchievementSchema, },
      { name: UserStats.name, schema: UserStatsSchema, },
      { name: DaySequence.name, schema: DaySequenceSchema, },
    ]),
    CoreModule,
  ],
  controllers: [UserController, AchievementController],
  providers: [],
})
export class UserModule {}
