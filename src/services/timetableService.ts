type Timetable = {
  id: string;
  course: string;
  day: string;
  start: string;
  end: string;
  room?: string;
  faculty?: string;
};

class TimetableService {
  private data: Timetable[] = [];

  constructor() {
    this.data = [
      { id: '1', course: 'Algorithms', day: 'Monday', start: '09:00', end: '10:00', room: 'A101', faculty: 'Prof. A' }
    ];
  }

  getAll() {
    return this.data;
  }

  create(item: Omit<Timetable, 'id'>) {
    const newItem = { id: String(Date.now()), ...item };
    this.data.push(newItem);
    return newItem;
  }
}

export default new TimetableService();
