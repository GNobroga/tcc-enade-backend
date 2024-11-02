import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import CoreModule from 'src/core/core.module';
import { Note, NoteSchema } from './note.schema';
import { NoteController } from './note.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Note.name, schema: NoteSchema }
    ]),
    CoreModule,
  ],
  controllers: [NoteController],
  providers: [],
})
export class NoteModule {}
