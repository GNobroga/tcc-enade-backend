import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'day_sequences', timestamps: true })
export class DaySequence extends Document {

    @Prop({ required: true })
    ownerId: string;  

    @Prop({ type: [Boolean], default: [false, false, false, false, false, false, false] })
    days: boolean[];  

    @Prop({ required: true, default: 0 })
    numberOfOffensives: number; 

    @Prop()
    startDate: Date; // Vai armazenar o dia que começou a ofensiva
}

export const DaySequenceSchema = SchemaFactory.createForClass(DaySequence);
