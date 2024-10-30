import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export default class AppConfig {

    constructor(private configService: ConfigService) {}

    get firebasePrivateKey() {
        return this.configService.getOrThrow('FIREBASE_PRIVATE_KEY');
    }

    get mongodbUrl() {
        return this.configService.getOrThrow('MONGODB_URL');
    }

    get host() {
        return this.configService.getOrThrow('HOST');
    }

    get port() {
        return this.configService.getOrThrow('PORT');
    }
}