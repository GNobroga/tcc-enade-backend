import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as firebaseAdmin from 'firebase-admin';
import { join } from 'path';
import AppConfig from './core/app-config';
import CoreModule from './core/core.module';
import InfraModule from './infra/infra.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory(appConfig: AppConfig) {
        return {
          uri: appConfig.mongodbUrl,
        }
      },
      inject: [AppConfig],
      imports: [CoreModule],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/static/',
    }),
    CoreModule,
    InfraModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements OnModuleInit {

  constructor(private _appConfig: AppConfig) {}

  onModuleInit() {
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(this._appConfig.firebasePrivateKey),
    });
  }
}
