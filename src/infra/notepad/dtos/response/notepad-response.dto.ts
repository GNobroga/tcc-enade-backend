import { Notepad } from "../../notepad.schema";

export class NotepadResponseDTO {

    public id: string;

    public title: string;

    public description: string;

    public color: string;

    public createdAt: Date;

    constructor(props: Notepad & { _id: any }) {
        this.id = props._id.toString();
        this.title = props.title;
        this.description = props.description;
        this.color = props.color;
        this.createdAt = props.createdAt;
    }
}