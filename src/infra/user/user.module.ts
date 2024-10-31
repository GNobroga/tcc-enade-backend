import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import AchievementController from './controllers/achievement.controller';
import { UserController } from './controllers/user.controller';
import { Achievement, AchievementSchema } from './schemas/achievement.schema';
import { UserAchievement, UserAchievementSchema } from './schemas/user-achievement.schema';
import AchievementService from './services/achievement.service';
import UserService from './services/user.service';
import { Statistics, StatisticsSchema } from './schemas/statistics.schema';
import StatisticsCronJob from './cron-jobs/statistics.cron-job';
import CoreModule from 'src/core/core.module';
import { DaySequence, DaySequenceSchema } from './schemas/day-sequence.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Achievement.name, schema: AchievementSchema },
      { name: UserAchievement.name, schema: UserAchievementSchema, },
      { name: Statistics.name, schema: StatisticsSchema, },
      { name: DaySequence.name, schema: DaySequenceSchema, },
    ]),
    CoreModule,
  ],
  controllers: [UserController, AchievementController],
  providers: [AchievementService, UserService, StatisticsCronJob],
})
export class UserModule {}
