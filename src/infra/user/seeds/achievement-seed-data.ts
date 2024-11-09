import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Achievement } from "../schemas/achievement.schema";
import { Model } from "mongoose";
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { UserAchievement } from "../schemas/user-achievement.schema";

@Injectable()
export default class AchievementSeedData {

    constructor(
        @InjectModel(Achievement.name) readonly achievementModel: Model<Achievement>,
        @InjectModel(UserAchievement.name) readonly userAchievement: Model<UserAchievement>,
    ) {}

    async populate() {
       try {
            const filePath = resolve('public', 'achievements.json');
            const data = JSON.parse(await readFile(filePath, 'utf-8')) as Achievement[];
            await this.userAchievement.deleteMany();
            await this.achievementModel.deleteMany();
            await Promise.all(data.map(achievement => this.achievementModel.create(achievement)));
            Logger.log('Achievements is saved successfully');
       } catch {
            Logger.error('Achievements could not be populated');
       }
    }
}