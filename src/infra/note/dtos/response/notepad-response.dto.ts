import { Types } from "mongoose";

export type NoteResponseDTOProps = {
    _id: Types.ObjectId;
    title: string;
    description: string;
    color: string;
    createdAt?: Date;
}

export class NotepadResponseDTO {
    
    public id: string;

    public title: string;

    public description: string;

    public color: string;

    public createdAt: Date;

    constructor(props: NoteResponseDTOProps) {
       this.id = props._id.toString();
       this.title = props.title;
       this.description = props.description;
       this.color = props.color;
       this.createdAt = props.createdAt;
    }
}

