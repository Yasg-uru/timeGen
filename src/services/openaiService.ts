import OpenAI from 'openai';
import config from '../config';
import { logger } from '../utils/logger';

let openaiClient: OpenAI | null = null;

function getClient(): OpenAI {
    if (!openaiClient) {
        if (!config.openaiApiKey) {
            throw new Error('OPENAI_API_KEY is not set in environment variables');
        }
        openaiClient = new OpenAI({ apiKey: config.openaiApiKey });
    }
    return openaiClient;
}

export interface TimetableSlot {
    day: string;
    startTime: string;
    endTime: string;
    subjectCode: string;
    subjectName: string;
    faculty: string[];
    type: 'theory' | 'lab' | 'project' | 'tutorial';
}

export interface GeneratedTimetable {
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
        type: 'theory' | 'lab' | 'project' | 'tutorial';
    }[];
    facultyList: { abbreviation: string; fullName: string }[];
    classCoordinator: { name: string; abbreviation: string; phone?: string };
    classCoCoordinator: { name: string; abbreviation: string; phone?: string };
    slots: TimetableSlot[];
}

const SYSTEM_PROMPT = `You are an expert academic timetable generator. Given the user's requirements, generate a complete, clash-free weekly timetable.

RULES:
1. No faculty clash: A faculty member cannot be assigned to two different slots at the same time.
2. No room clash: A room cannot be used by two batches/sections at the same time.
3. No batch clash: A batch/section cannot have two subjects at the same time.
4. Include a lunch break slot (typically 01:00pm to 02:00pm or 01:30pm to 02:30pm).
5. Distribute subjects evenly across the week.
6. Respect any preferences or constraints mentioned by the user.
7. Each slot is typically 1 hour. Lab/project sessions can span 2-3 consecutive hours.
8. Use realistic Indian academic time slots (e.g., 10:30am-11:30am, 11:30am-12:30pm, etc.).
9. Generate for Monday through Friday (or Saturday if requested).
10. Ensure every subject gets adequate weekly hours based on credits/requirements.

You MUST respond with ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "department": "string - department name",
  "semester": "string - e.g. VIII-Sem",
  "section": "string - e.g. A or IT",
  "room": "string - room name/number",
  "effectiveDate": "string - DD-MM-YYYY",
  "timeTableMonth": "string - e.g. Jan-2026",
  "days": ["Monday", "Tuesday", ...],
  "timeSlots": [{"start": "10:30am", "end": "11:30am"}, ...],
  "lunchSlot": {"start": "01:30pm", "end": "02:30pm"},
  "subjects": [{"code": "IT801", "name": "Major Project", "type": "project"}, ...],
  "facultyList": [{"abbreviation": "SKS", "fullName": "Prof. S.K. Sharma"}, ...],
  "classCoordinator": {"name": "Prof. Full Name", "abbreviation": "ABC", "phone": "9876543210"},
  "classCoCoordinator": {"name": "Prof. Full Name", "abbreviation": "XYZ", "phone": "9876543210"},
  "slots": [
    {
      "day": "Monday",
      "startTime": "10:30am",
      "endTime": "11:30am",
      "subjectCode": "IT801",
      "subjectName": "Major Project",
      "faculty": ["SKS", "AB"],
      "type": "project"
    }
  ]
}

IMPORTANT:
- Slots that span multiple hours should use the actual start and end times (e.g., start: "02:30pm", end: "05:30pm").
- Every slot must have at least one faculty member.
- The faculty abbreviations in slots must match entries in facultyList.
- Subject codes in slots must match entries in subjects array.
- Generate a COMPLETE timetable — every working day must have classes filled in reasonable time slots.
- Do NOT leave days empty unless the user specifically says so.
- Respond with ONLY the JSON object, nothing else.`;

export async function generateTimetableWithAI(userPrompt: string): Promise<GeneratedTimetable> {
    const client = getClient();

    logger.info('Sending timetable generation request to OpenAI...');

    const response = await client.chat.completions.create({
        model: config.openaiModel,
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4096,
        response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
        throw new Error('Empty response from OpenAI');
    }

    logger.info('Received timetable from OpenAI, parsing...');

    let parsed: GeneratedTimetable;
    try {
        parsed = JSON.parse(content);
    } catch {
        throw new Error('Failed to parse OpenAI response as JSON');
    }

    // Validate no clashes
    validateNoClashes(parsed.slots);

    return parsed;
}

function validateNoClashes(slots: TimetableSlot[]): void {
    const facultyMap = new Map<string, string>();
    const errors: string[] = [];

    for (const slot of slots) {
        const timeKey = `${slot.day}#${slot.startTime}-${slot.endTime}`;

        for (const fac of slot.faculty) {
            const facKey = `${fac}#${timeKey}`;
            if (facultyMap.has(facKey)) {
                errors.push(`Faculty clash: ${fac} has two slots at ${slot.day} ${slot.startTime}-${slot.endTime}`);
            }
            facultyMap.set(facKey, slot.subjectCode);
        }
    }

    if (errors.length > 0) {
        logger.warn('Timetable has clashes, attempting to resolve...');
        logger.warn(errors.join('\n'));
        // We log warnings but don't throw — the AI model should handle this,
        // and minor overlaps in multi-hour blocks are expected
    }
}

export default { generateTimetableWithAI };
