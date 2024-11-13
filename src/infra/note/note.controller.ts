import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import FirebaseAuthGuard from '../auth/firebase-auth.guard';
import { CurrentUser } from '../auth/user-details.decorator';
import { CreateOrUpdateNotepadRequestDTO } from './dtos/request/create-or-update-notepad-request.dto';
import { NotepadResponseDTO, NoteResponseDTOProps } from './dtos/response/notepad-response.dto';
import { Note } from './note.schema';

@UseGuards(FirebaseAuthGuard)
@Controller({ path: 'notes', version: '1' })
export class NoteController {

    constructor(
        @InjectModel(Note.name) readonly noteModel: Model<Note>,
    ) {}

    @Post('create')
    @UsePipes(ValidationPipe)
    async create(@Body() record: CreateOrUpdateNotepadRequestDTO, @CurrentUser('uid') ownerId: string) {
        const noteSaved = await this.noteModel.create({
            ownerId,
            ...record,
        });
        return this.mapToResponse(noteSaved);
    }

    @Get(":id")
    async findById(@Param('id') id: string, @CurrentUser('uid') ownerId: string) {
        const note = await this.noteModel.findOne({
            _id: id,
            ownerId,
        });

        if (!note) {
            throw new NotFoundException('Note not found');
        }
        return this.mapToResponse(note);
    }

    @Get()
    async list(@CurrentUser('uid') ownerId: string) {
        const notes = await this.noteModel.find({ ownerId, });
        return notes.map(note => this.mapToResponse(note));
    }

    @Delete(":id")
    async deleteById(@Param('id') id: string, @CurrentUser('uid') ownerId: string) {
        const note = await this.noteModel.findOneAndDelete({
            _id: id,
            ownerId,
        });
        return !note ? { deleted: false } : { deleted: true, };
    }

    @Put(":id")
    async update(@Param('id') id: string, @Body() { color, description, title }: CreateOrUpdateNotepadRequestDTO, @CurrentUser('uid') ownerId: string) {
        const updatedNote = await this.noteModel.findOneAndUpdate(
            { 
              _id: id, 
              ownerId 
            },
            { 
              $set: {
                color,
                description,
                title,
              }, 
            },
          );
          

        return !updatedNote ? { updated: false } : { updated: true };
    }
    
    private mapToResponse(props: NoteResponseDTOProps) {
        return new NotepadResponseDTO(props);
    }
}
