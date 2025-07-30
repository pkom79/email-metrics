export function filterLast90Days<T extends { sentDate: Date }>(items: T[]): T[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);
  
  return items.filter(item => item.sentDate >= cutoffDate);
}

export function getDateRange(startDays: number = 90): { start: Date; end: Date; formatted: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - startDays);
  
  const formatted = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  
  return { start, end, formatted };
}

export function groupByMonth<T extends { sentDate: Date }>(items: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  
  items.forEach(item => {
    const monthKey = `${item.sentDate.getFullYear()}-${String(item.sentDate.getMonth() + 1).padStart(2, '0')}`;
    if (!grouped.has(monthKey)) {
      grouped.set(monthKey, []);
    }
    grouped.get(monthKey)!.push(item);
  });
  
  return grouped;
}

export function detectSeasonalEvents(dateRange: { start: Date; end: Date }): string[] {
  const events: string[] = [];
  const year = dateRange.end.getFullYear();
  
  // Black Friday / Cyber Monday (4th Thursday of November + following Monday)
  const thanksgiving = getLastThursdayOfMonth(10, year); // November is month 10 (0-indexed)
  const blackFriday = new Date(thanksgiving);
  blackFriday.setDate(blackFriday.getDate() + 1);
  const cyberMonday = new Date(thanksgiving);
  cyberMonday.setDate(cyberMonday.getDate() + 4);
  
  if (isDateInRange(blackFriday, dateRange) || isDateInRange(cyberMonday, dateRange)) {
    events.push('Black Friday/Cyber Monday');
  }
  
  // Holiday Season (Dec 15-25)
  const holidayStart = new Date(year, 11, 15);
  const holidayEnd = new Date(year, 11, 25);
  if (isDateInRange(holidayStart, dateRange) || isDateInRange(holidayEnd, dateRange)) {
    events.push('Holiday Season');
  }
  
  // Add more seasonal events as needed
  
  return events;
}

function getLastThursdayOfMonth(month: number, year: number): Date {
  const lastDay = new Date(year, month + 1, 0);
  const dayOfWeek = lastDay.getDay();
  const diff = dayOfWeek >= 4 ? dayOfWeek - 4 : dayOfWeek + 3;
  lastDay.setDate(lastDay.getDate() - diff);
  return lastDay;
}

function isDateInRange(date: Date, range: { start: Date; end: Date }): boolean {
  return date >= range.start && date <= range.end;
}
