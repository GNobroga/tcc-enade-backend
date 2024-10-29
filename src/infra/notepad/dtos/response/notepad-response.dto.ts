import { Types } from "mongoose";

type Props = {
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

    constructor(props: Props) {
       this.id = props._id.toString();
       this.title = props.title;
       this.description = props.description;
       this.color = props.color;
       this.createdAt = props.createdAt;
    }
}

