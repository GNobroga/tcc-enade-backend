import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AchievementRequestDTO } from "../dtos/request/achievement-request.dto";
import { Achievement } from "../schemas/achievement.schema";
import { UserAchievement } from "../schemas/user-achievement.schema";

@Injectable()
export default class AchievementService {

    constructor(
        @InjectModel(Achievement.name) readonly model: Model<Achievement>,
        @InjectModel(UserAchievement.name) readonly userAchievementModel: Model<UserAchievement>
    ) {}

    async insert(record: AchievementRequestDTO) {
        const result = await this.model.create(record);
        return this.mapToObject(result.toObject());
    }

    async listAll() {
        const result = await this.model.find();
        return result.map(this.mapToObject);
    }

    async findById(id: string) {
        const result = await this.model.findById(id);
        if (!result) {
            throw new NotFoundException(`Achievement ${id} does not exist`);
        }
        return this.mapToObject(result.toObject());
    }

    async deleteById(id: string) {
        const result = await this.model.deleteOne({ _id: id });
        return result.deletedCount > 0;
    }

    private mapToObject(src: Achievement & Required<{ _id: unknown; }>) {
        return {
            id: src._id,
            header: src.header,
            detail: src.detail,
            type: src.type,
            goal: src.goal,
            imageUrl: src.imageUrl,
            createdAt: src.createdAt,
        }
    }

}