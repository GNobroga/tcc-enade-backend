import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import CoreModule from 'src/core/core.module';
import AchievementController from './controllers/achievement.controller';
import { UserController } from './controllers/user.controller';
import { Achievement, AchievementSchema } from './schemas/achievement.schema';
import { DaySequence, DaySequenceSchema } from './schemas/day-sequence.schema';
import { UserAchievement, UserAchievementSchema } from './schemas/user-achievement.schema';
import { UserStats, UserStatsSchema } from './schemas/user-stats.schema';
import AchievementSeedData from './seeds/achievement-seed-data';
import RankingController from './controllers/ranking.controller';
import UserStatsTask from './cron-tasks/user-stats.task';
import { NoteModule } from '../note/note.module';
import { Chat, ChatSchema } from '../websocket/schemas/chat.schema';
import { UserFriend, UserFriendSchema } from '../websocket/schemas/user-friend.schema';
import { QuizHistory, QuizHistorySchema } from '../quiz/schemas/quiz-history.schema';
import { QuizCompletion, QuizCompletionSchema } from '../quiz/schemas/quiz-completion.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Achievement.name, schema: AchievementSchema },
      { name: UserAchievement.name, schema: UserAchievementSchema, },
      { name: UserStats.name, schema: UserStatsSchema, },
      { name: DaySequence.name, schema: DaySequenceSchema, },
      { name: Chat.name, schema: ChatSchema },
      { name: UserFriend.name, schema: UserFriendSchema },
      { name: QuizHistory.name, schema: QuizHistorySchema },
      { name: QuizCompletion.name, schema: QuizCompletionSchema },
    ]),
    CoreModule,
    NoteModule
  ],
  controllers: [UserController, AchievementController, RankingController],
  providers: [AchievementSeedData, UserStatsTask],
  exports: [
    MongooseModule.forFeature([
      { name: Achievement.name, schema: AchievementSchema },
      { name: UserAchievement.name, schema: UserAchievementSchema, },
      { name: UserStats.name, schema: UserStatsSchema, },
      { name: DaySequence.name, schema: DaySequenceSchema, },
    ]),
  ]
})
export class UserModule implements OnModuleInit {

  constructor(
    readonly achievementSeedData: AchievementSeedData,
  ) {}

  async onModuleInit() {
    await this.achievementSeedData.populate();
  }
}
