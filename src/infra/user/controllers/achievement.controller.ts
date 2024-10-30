import { Body, Controller, Get, Param, Post, UsePipes, ValidationPipe } from "@nestjs/common";
import { AchievementRequestDTO } from "../dtos/request/achievement-request.dto";
import AchievementService from "../services/achievement.service";

@Controller({ path: 'achievements', version: '1', })
export default class AchievementController {

    constructor(
        readonly achievementService: AchievementService,
    ) {}

    // @UseGuards(FirebaseAuthGuard)
    // @Get('associate/:id') 
    // async associateWithUser(@Param('id') achievementId: string, @CurrentUser('uid') userId: string) {
    //     return this.userAchievementService.insert(achievementId, userId);
    // }

    @Get()
    async listAll() {
        return this.achievementService.listAll();
    }

    @Get(":id")
    async findById(@Param('id') id: string) {
        return this.achievementService.findById(id);
    }

    @Post()
    @UsePipes(ValidationPipe)
    async insert(@Body() record: AchievementRequestDTO) {
        return this.achievementService.insert(record);
    }
}