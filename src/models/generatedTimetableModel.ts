import { Schema, model, Document, Types } from 'mongoose';

export interface IGeneratedTimetable extends Document {
    prompt: string;
    department: string;
    semester: string;
    section: string;
    room: string;
    effectiveDate: string;
    timeTableMonth: string;
    days: string[];
    timeSlots: { start: string; end: string }[];
    lunchSlot: { start: string; end: string };
    subjects: {
        code: string;
        name: string;
        type: string;
    }[];
    facultyList: { abbreviation: string; fullName: string }[];
    classCoordinator: { name: string; abbreviation: string; phone?: string };
    classCoCoordinator: { name: string; abbreviation: string; phone?: string };
    slots: {
        day: string;
        startTime: string;
        endTime: string;
        subjectCode: string;
        subjectName: string;
        faculty: string[];
        type: string;
    }[];
    htmlContent: string;
    createdBy?: string | Types.ObjectId;
}

const generatedTimetableSchema = new Schema<IGeneratedTimetable>(
    {
        prompt: { type: String, required: true },
        department: { type: String, required: true },
        semester: { type: String, required: true },
        section: { type: String, default: '' },
        room: { type: String, required: true },
        effectiveDate: { type: String, required: true },
        timeTableMonth: { type: String, required: true },
        days: [{ type: String }],
        timeSlots: [
            {
                start: { type: String, required: true },
                end: { type: String, required: true }
            }
        ],
        lunchSlot: {
            start: { type: String, required: true },
            end: { type: String, required: true }
        },
        subjects: [
            {
                code: { type: String, required: true },
                name: { type: String, required: true },
                type: {
                    type: String,
                    default: 'theory'
                }
            }
        ],
        facultyList: [
            {
                abbreviation: { type: String, required: true },
                fullName: { type: String, required: true }
            }
        ],
        classCoordinator: {
            name: { type: String, default: '' },
            abbreviation: { type: String, default: '' },
            phone: { type: String, default: '' }
        },
        classCoCoordinator: {
            name: { type: String, default: '' },
            abbreviation: { type: String, default: '' },
            phone: { type: String, default: '' }
        },
        slots: [
            {
                day: { type: String, required: true },
                startTime: { type: String, required: true },
                endTime: { type: String, required: true },
                subjectCode: { type: String, required: true },
                subjectName: { type: String, required: true },
                faculty: [{ type: String }],
                type: {
                    type: String,
                    default: 'theory'
                }
            }
        ],
        htmlContent: { type: String, required: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: false }
    },
    { timestamps: true }
);

const GeneratedTimetable = model<IGeneratedTimetable>(
    'GeneratedTimetable',
    generatedTimetableSchema
);

export default GeneratedTimetable;
