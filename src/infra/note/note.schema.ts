import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";


@Schema({ collection: 'notes', timestamps: true, })
export class Note {

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    description: string;

    @Prop({ default: 'lightblue' })
    color: string;

    @Prop({ required: true})
    ownerId: string;

    createdAt?: Date;
    
    updatedAt?: Date;
}

export const NoteSchema = SchemaFactory.createForClass(Note);