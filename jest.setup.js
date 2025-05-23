// Mock date-fns to avoid ES module issues
jest.mock('date-fns', () => ({
  format: jest.fn((date, format) => date.toString()),
  parseISO: jest.fn((dateString) => new Date(dateString)),
  isBefore: jest.fn((date1, date2) => date1 < date2),
  isAfter: jest.fn((date1, date2) => date1 > date2),
  addDays: jest.fn((date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }),
  // Add other date-fns functions as needed
}));
