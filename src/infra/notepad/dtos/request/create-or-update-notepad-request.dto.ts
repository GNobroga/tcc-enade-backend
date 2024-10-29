import { IsNotEmpty, IsString, MaxLength }from 'class-validator';

export class CreateOrUpdateNotepadRequestDTO {
    
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    title: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(5000)
    description: string;

    @IsString()
    @IsNotEmpty()
    color: string;
}