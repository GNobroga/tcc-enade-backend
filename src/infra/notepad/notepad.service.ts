import { ConflictException, Injectable, NotFoundException, Scope } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Notepad } from "./notepad.schema";
import { CreateOrUpdateNotepadRequestDTO } from "./dtos/request/create-or-update-notepad-request.dto";

@Injectable({
    scope: Scope.REQUEST,
})
export default class NotepadService {

    constructor(
        @InjectModel(Notepad.name) 
        private _model: Model<Notepad>
    ) {}

    async create(record: CreateOrUpdateNotepadRequestDTO, ownerId: string) {
        const result = await this._model.create({
            ...record,
            ownerId
        });
        return result.toObject();
    }

    async listByOwnerId(ownerId: string) {
        const docs = await this._model.find({ ownerId });
        return docs.map(doc => doc.toObject());
    }

    async deleteByIdAndOwnerId(id: string, ownerId: string) {
        const result = await this._model.deleteOne({
            _id: id,
            ownerId
        });
        return result.deletedCount > 0;
    }

    async update(id: string, ownerId: string, record: CreateOrUpdateNotepadRequestDTO) {
        const doc = await this._model.findOne({ _id: id });

        if (!doc) {
            throw new NotFoundException(`Notepad with id "${id}" not found.`);
        }
        
        if (doc.ownerId !== ownerId) {
            throw new ConflictException(`The notepad with id "${id}" is not owned by the logged-in user.`);
        }
        
        const result = await this._model.findByIdAndUpdate(id, record, { new: true, });

        return result != null;
    }

    async findByOwnerId(id: string, ownerId: string) {
        const doc = await this._model.findOne({ _id: id, ownerId });
        if (!doc) {
            throw new NotFoundException(`Notepad with id "${id}" not found.`);
        }
        return doc.toObject();
    }
}

