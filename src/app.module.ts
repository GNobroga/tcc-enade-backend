import { Module, OnModuleInit } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import * as firebaseAdmin from 'firebase-admin';
import AppConfig from './core/app-config';
import CoreModule from './core/core.module';
import FirebaseAuthGuard from './infra/auth/firebase-auth.guard';
import InfraModule from './infra/infra.module';

@Module({
  imports: [
      CoreModule,
      MongooseModule.forRootAsync({
        useFactory(appConfig: AppConfig) {
          return {
            uri: appConfig.mongodbUrl,
          }
        },
        inject: [AppConfig],
        imports: [CoreModule],
      }),
      InfraModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: FirebaseAuthGuard,
    },
],
})
export class AppModule implements OnModuleInit {

  constructor(private _appConfig: AppConfig) {}

  onModuleInit() {
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(this._appConfig.firebasePrivateKey),
    });
  }
}
