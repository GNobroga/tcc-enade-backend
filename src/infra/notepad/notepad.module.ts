import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotepadController } from './notepad.controller';
import { Notepad, NotepadSchema } from './notepad.schema';
import NotepadService from './notepad.service';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Notepad.name, schema: NotepadSchema }
  ])],
  controllers: [NotepadController],
  providers: [NotepadService],
})
export class NotepadModule {}
