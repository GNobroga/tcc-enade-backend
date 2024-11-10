import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { UserStats } from "../schemas/user-stats.schema";
import { Model } from "mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";

@Injectable()
export default class UserStatsTask {

    readonly logger = new Logger(UserStatsTask.name);

    constructor(
        @InjectModel(UserStats.name) readonly userStatsModel: Model<UserStats>,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async resetDailyHintCount() {
      try {
        const result = await this.userStatsModel.updateMany(
          {}, 
          { $set: { dailyHintCount: 0 } }
        );
  
        if (result.modifiedCount > 0) {
          this.logger.log(`Successfully reset dailyHintCount for ${result.modifiedCount} users.`);
        } else {
          this.logger.log('No users needed resetting the dailyHintCount.');
        }
      } catch (err) {
        this.logger.error('Failed to reset dailyHintCount:', err.stack);
      }
    }
}