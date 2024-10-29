import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";


@Schema({ collection: 'notepads', timestamps: true, })
export class Notepad {

    @Prop()
    title: string;

    @Prop()
    description: string;

    @Prop()
    color: string;

    @Prop()
    ownerId: string;

    createdAt?: Date;
    updatedAt?: Date;
}

export const NotepadSchema = SchemaFactory.createForClass(Notepad);