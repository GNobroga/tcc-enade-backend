import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Statistics } from "../schemas/statistics.schema";
import { DaySequence } from "../schemas/day-sequence.schema";

@Injectable()
export default class UserService {

    constructor(
        @InjectModel(Statistics.name) 
        readonly statisticsModel: Model<Statistics>,
        @InjectModel(DaySequence.name) 
        readonly daySequenceModel: Model<DaySequence>,
    ) {}


    async initializeUserProgress(userId: string) {
        const existingStatistics = await this.statisticsModel.findOne({ userId });
        if (existingStatistics) return;
   
        await this.statisticsModel.create({ userId, });
  
        await this.daySequenceModel.create({
            userId,
            days: [false, false, false, false, false, false, false], 
            startDate: new Date(),
            isComplete: false
        });
    }
    
}