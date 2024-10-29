import { Module } from "@nestjs/common";
import AppConfig from "./app-config";
import { ConfigModule } from "@nestjs/config";

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: '.env',
        }),
    ],
    providers: [AppConfig],
    exports: [AppConfig],
})
export default class CoreModule {}