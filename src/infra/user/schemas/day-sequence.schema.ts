import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'day_sequences', timestamps: true })
export class DaySequence extends Document {

    @Prop({ required: true })
    ownerId: string;  

    @Prop({ type: [Boolean], default: [false, false, false, false, false, false, false] })
    days: boolean[];  

    @Prop({ default: () => new Date() })
    startDate: Date;  

    @Prop({ default: false })
    isComplete: boolean;  
}

export const DaySequenceSchema = SchemaFactory.createForClass(DaySequence);
