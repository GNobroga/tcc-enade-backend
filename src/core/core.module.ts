import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import AppConfig from "./app-config";

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