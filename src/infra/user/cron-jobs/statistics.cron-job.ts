import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Model } from "mongoose";
import { Statistics } from "../schemas/statistics.schema";

@Injectable()
export default class StatisticsCronJob {

    constructor(
        @InjectModel(Statistics.name) 
        readonly model: Model<Statistics>
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async resetStatistics() {
        // Resetar alguns dos statistics a cada 24 horas.
        await this.model.updateMany({
            countWrongQuestions: 0,
            countQuestionsDone: 0,
            averageTime: 0,
        });
    }
}