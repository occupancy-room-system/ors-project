const LAB_TIME_ZONE = 'Asia/Bangkok';
const LAB_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?$/;

export function parseLabDateTime(value: string) {
  const match = LAB_DATE_TIME_PATTERN.exec(value);
  if (!match) return new Date(value);

  const [, year, month, day, hour, minute, second = '0', fraction = ''] = match;
  const milliseconds = Number(`0.${fraction}`) * 1000;
  const utcGuess = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    milliseconds,
  );
  const formattedParts = new Intl.DateTimeFormat('en-US', {
    timeZone: LAB_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(new Date(utcGuess));
  const values = Object.fromEntries(formattedParts.map(({ type, value }) => [type, value]));
  const zonedWallTime = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
    milliseconds,
  );
  return new Date(utcGuess - (zonedWallTime - utcGuess));
}

function getLabTimeOnDate(date: Date, hour: number) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: LAB_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const wallTime = new Date(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
    date.getMilliseconds(),
  );
  const offset = wallTime.getTime() - date.getTime();
  const targetWallTime = new Date(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    hour,
    0,
    0,
    0,
  );
  return new Date(targetWallTime.getTime() - offset);
}

export const LAB_OPENS_HOUR = 9;
export const LAB_CLOSES_HOUR = 17;
export const LAB_HOURS_DISPLAY = '09:00 AM – 05:00 PM';
export const LAB_TIMEZONE = LAB_TIME_ZONE;

export function getLabCurrentTimeInBangkok(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: LAB_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

export function getLabCurrentDateInBangkok(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: LAB_TIME_ZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function getLabOperatingStatus(now: Date = new Date()) {
  const openTime = getLabTimeOnDate(now, LAB_OPENS_HOUR);
  const closeTime = getLabTimeOnDate(now, LAB_CLOSES_HOUR);
  const isOpen = now >= openTime && now < closeTime;

  let progress = 0;
  if (isOpen) {
    const total = closeTime.getTime() - openTime.getTime();
    const elapsed = now.getTime() - openTime.getTime();
    progress = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  }

  const timeString = getLabCurrentTimeInBangkok(now);
  const dateString = getLabCurrentDateInBangkok(now);

  let minutesUntilClose = 0;
  let minutesUntilOpen = 0;
  if (isOpen) {
    minutesUntilClose = Math.max(0, Math.round((closeTime.getTime() - now.getTime()) / 60000));
  } else if (now < openTime) {
    minutesUntilOpen = Math.max(0, Math.round((openTime.getTime() - now.getTime()) / 60000));
  }

  return {
    isOpen,
    openTime,
    closeTime,
    progress,
    timeString,
    dateString,
    minutesUntilClose,
    minutesUntilOpen,
  };
}

export function isLabOpenAt(date: Date) {
  return date >= getLabTimeOnDate(date, LAB_OPENS_HOUR) && date < getLabTimeOnDate(date, LAB_CLOSES_HOUR);
}

export function getLabSessionEndTime(start: Date, durationHours: number) {
  return new Date(Math.min(
    start.getTime() + durationHours * 3600000,
    getLabTimeOnDate(start, 17).getTime(),
  ));
}

export function getLabReservationActivationDeadline(start: Date) {
  return new Date(Math.min(
    start.getTime() + 20 * 60000,
    getLabTimeOnDate(start, 17).getTime(),
  ));
}
