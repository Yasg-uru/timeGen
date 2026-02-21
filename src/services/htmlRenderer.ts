import { GeneratedTimetable, TimetableSlot } from './openaiService';

/**
 * Renders a GeneratedTimetable into an HTML table matching the
 * official Indian university timetable layout.
 */
export function renderTimetableHTML(tt: GeneratedTimetable): string {
    const days = tt.days;
    const timeSlots = tt.timeSlots;
    const lunchSlot = tt.lunchSlot;

    // Build ordered column list including lunch
    type Column = { start: string; end: string; isLunch: boolean };
    const columns: Column[] = [];

    for (const ts of timeSlots) {
        if (ts.start === lunchSlot.start && ts.end === lunchSlot.end) {
            columns.push({ ...ts, isLunch: true });
        } else if (ts.start === lunchSlot.start || ts.end === lunchSlot.end) {
            columns.push({ ...ts, isLunch: false });
        } else {
            // Check if lunch should be inserted before this slot
            if (
                columns.length > 0 &&
                !columns.find(c => c.isLunch) &&
                compareTimes(ts.start, lunchSlot.start) >= 0
            ) {
                columns.push({ start: lunchSlot.start, end: lunchSlot.end, isLunch: true });
            }
            columns.push({ ...ts, isLunch: false });
        }
    }

    // If lunch not inserted yet, find its proper position
    if (!columns.find(c => c.isLunch)) {
        const lunchIdx = columns.findIndex(c => compareTimes(c.start, lunchSlot.start) >= 0);
        if (lunchIdx >= 0) {
            columns.splice(lunchIdx, 0, { start: lunchSlot.start, end: lunchSlot.end, isLunch: true });
        } else {
            columns.push({ start: lunchSlot.start, end: lunchSlot.end, isLunch: true });
        }
    }

    // Build a lookup: day -> array of slots
    const slotsByDay = new Map<string, TimetableSlot[]>();
    for (const day of days) {
        slotsByDay.set(day, tt.slots.filter(s => s.day === day));
    }

    // Subject summary line
    const subjectSummary = tt.subjects
        .map(s => `${s.code} - ${s.name}`)
        .join(' | ');

    const facultySummary = tt.facultyList
        .map(f => f.abbreviation)
        .join(' / ');

    // Start building HTML
    const totalCols = columns.length + 2; // Day column + Subject Code Theory column

    let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Timetable - ${tt.department}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', Times, serif; background: #fff; padding: 20px; }
  .container { max-width: 1200px; margin: 0 auto; }
  .header { text-align: center; margin-bottom: 20px; }
  .header h2 { text-decoration: underline; font-size: 18px; margin-bottom: 8px; }
  .header p { font-size: 14px; font-weight: bold; margin-bottom: 3px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
  th, td { border: 1px solid #000; padding: 6px 8px; text-align: center; vertical-align: middle; }
  th { background-color: #f5f5f5; font-weight: bold; }
  .day-col { width: 80px; font-weight: bold; text-align: left; padding-left: 10px; }
  .lunch-col { background-color: #f0f0f0; font-weight: bold; font-size: 13px; }
  .subject-theory-col { width: 100px; font-size: 11px; }
  .footer-table { width: 70%; margin: 10px auto; font-size: 12px; }
  .footer-table td { padding: 4px 8px; }
  .subject-bar { background-color: #555; color: #fff; padding: 6px; font-weight: bold; }
  .slot-cell { font-size: 11px; line-height: 1.3; }
  @media print {
    body { padding: 0; }
    table { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h2>Department of ${tt.department}</h2>
    <p>Time Table: ${tt.timeTableMonth} w.e.f: ${tt.effectiveDate}</p>
    <p>${tt.semester}- ROOM NO: ${tt.room}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th class="day-col">Day's</th>`;

    // Time slot headers
    for (const col of columns) {
        if (col.isLunch) {
            html += `\n        <th class="lunch-col" rowspan="${days.length + 1}">LUNCH</th>`;
        } else {
            html += `\n        <th>${col.start} to ${col.end}</th>`;
        }
    }
    html += `\n        <th class="subject-theory-col">Subject Code Theory</th>`;
    html += `\n      </tr>
    </thead>
    <tbody>`;

    // Build each day row
    for (let di = 0; di < days.length; di++) {
        const day = days[di];
        const daySlots = slotsByDay.get(day) || [];
        html += `\n      <tr>`;
        html += `\n        <td class="day-col">${day}</td>`;

        for (const col of columns) {
            if (col.isLunch) {
                // Lunch is handled via rowspan in the header — skip in subsequent rows
                if (di === 0) continue; // Already have rowspan from header
                continue; // Don't render lunch cells for body rows
            }

            // Find slot that covers this time column
            const matchingSlot = daySlots.find(s => {
                const slotStart = compareTimes(s.startTime, col.start);
                const slotEnd = compareTimes(s.endTime, col.end);
                // Slot starts at or before col start AND ends at or after col end
                return slotStart <= 0 && slotEnd >= 0;
            });

            if (matchingSlot) {
                // Check if this is a multi-column slot — only render it on the first matching column
                const firstMatchingCol = columns.find(c =>
                    !c.isLunch &&
                    compareTimes(matchingSlot.startTime, c.start) <= 0 &&
                    compareTimes(matchingSlot.endTime, c.end) >= 0
                );

                if (firstMatchingCol === col) {
                    // Calculate colspan
                    const spannedCols = columns.filter(c =>
                        !c.isLunch &&
                        compareTimes(matchingSlot.startTime, c.start) <= 0 &&
                        compareTimes(matchingSlot.endTime, c.end) >= 0
                    );
                    const colspan = spannedCols.length;
                    const facStr = matchingSlot.faculty.join('/');
                    const cellContent = `${matchingSlot.subjectCode} (${matchingSlot.subjectName})-${facStr}`;
                    html += `\n        <td class="slot-cell"${colspan > 1 ? ` colspan="${colspan}"` : ''}>${cellContent}</td>`;
                }
                // else: this column is spanned by a previous colspan — don't render
            } else {
                html += `\n        <td></td>`;
            }
        }

        // Subject code theory column — show on first row with rowspan
        if (di === 0) {
            const theorySubjects = tt.subjects.map(s => `${s.code}-${s.name}`).join('<br>');
            html += `\n        <td class="subject-theory-col" rowspan="${days.length}">${theorySubjects}</td>`;
        }

        html += `\n      </tr>`;
    }

    html += `\n    </tbody>
  </table>`;

    // Footer: subject list + coordinator info
    html += `
  <table style="width:100%">
    <tr>
      <td class="subject-bar" colspan="2">${subjectSummary}</td>
      <td colspan="2"></td>
    </tr>
    <tr>
      <td colspan="2" style="text-align:left; padding:8px; font-size:12px;">${facultySummary}</td>
      <td style="font-weight:bold; border:1px solid #000;">Class Coordinator</td>
      <td style="font-weight:bold; border:1px solid #000;">Class Co-coordinator</td>
    </tr>
    <tr>
      <td colspan="2"></td>
      <td style="border:1px solid #000; font-size:12px;">
        ${tt.classCoordinator.name}<br>(${tt.classCoordinator.abbreviation})
        ${tt.classCoordinator.phone ? '<br>' + tt.classCoordinator.phone : ''}
      </td>
      <td style="border:1px solid #000; font-size:12px;">
        ${tt.classCoCoordinator.name}<br>(${tt.classCoCoordinator.abbreviation})
        ${tt.classCoCoordinator.phone ? '<br>' + tt.classCoCoordinator.phone : ''}
      </td>
    </tr>
  </table>
</div>
</body>
</html>`;

    return html;
}

/** Compare two time strings like "10:30am", "01:30pm". Returns -1, 0, or 1. */
function compareTimes(a: string, b: string): number {
    const toMinutes = (t: string): number => {
        const normalized = t.toLowerCase().trim();
        const isPM = normalized.includes('pm');
        const cleaned = normalized.replace(/(am|pm)/i, '').trim();
        const [hStr, mStr] = cleaned.split(':');
        let h = parseInt(hStr, 10);
        const m = parseInt(mStr || '0', 10);
        if (isPM && h !== 12) h += 12;
        if (!isPM && h === 12) h = 0;
        return h * 60 + m;
    };
    const ma = toMinutes(a);
    const mb = toMinutes(b);
    if (ma < mb) return -1;
    if (ma > mb) return 1;
    return 0;
}

export default { renderTimetableHTML };
