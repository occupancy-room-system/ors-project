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

export interface LabConfig {
  openHour: number;
  closeHour: number;
  workstationsEnabled: boolean;
}

export const DEFAULT_LAB_CONFIG: LabConfig = {
  openHour: 9,
  closeHour: 17,
  workstationsEnabled: true,
};

export const LAB_CONFIG_STORAGE_KEY = 'ors_lab_config';
export const LAB_CONFIG_EVENT = 'ors_lab_config_change';

export function formatLabHour(hour: number): string {
  const normalized = ((hour % 24) + 24) % 24;
  const period = normalized >= 12 ? 'PM' : 'AM';
  const displayHour = normalized % 12 === 0 ? 12 : normalized % 12;
  const padded = displayHour.toString().padStart(2, '0');
  return `${padded}:00 ${period}`;
}

export function formatLabHoursRange(openHour: number, closeHour: number): string {
  return `${formatLabHour(openHour)} – ${formatLabHour(closeHour)}`;
}

export function getLabConfig(): LabConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_LAB_CONFIG };
  try {
    const raw = localStorage.getItem(LAB_CONFIG_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_LAB_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      openHour: typeof parsed.openHour === 'number' && parsed.openHour >= 0 && parsed.openHour <= 23 ? parsed.openHour : DEFAULT_LAB_CONFIG.openHour,
      closeHour: typeof parsed.closeHour === 'number' && parsed.closeHour >= 0 && parsed.closeHour <= 24 ? parsed.closeHour : DEFAULT_LAB_CONFIG.closeHour,
      workstationsEnabled: typeof parsed.workstationsEnabled === 'boolean' ? parsed.workstationsEnabled : true,
    };
  } catch {
    return { ...DEFAULT_LAB_CONFIG };
  }
}

export function setLabConfig(partial: Partial<LabConfig>): LabConfig {
  const current = getLabConfig();
  const next: LabConfig = {
    openHour: partial.openHour !== undefined ? partial.openHour : current.openHour,
    closeHour: partial.closeHour !== undefined ? partial.closeHour : current.closeHour,
    workstationsEnabled: partial.workstationsEnabled !== undefined ? partial.workstationsEnabled : current.workstationsEnabled,
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LAB_CONFIG_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(LAB_CONFIG_EVENT, { detail: next }));
    } catch {}
  }
  return next;
}

export function resetLabConfig(): LabConfig {
  return setLabConfig({ ...DEFAULT_LAB_CONFIG });
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

export function getLabOperatingStatus(now: Date = new Date(), customConfig?: LabConfig) {
  const config = customConfig ?? getLabConfig();
  const openTime = getLabTimeOnDate(now, config.openHour);
  const closeTime = getLabTimeOnDate(now, config.closeHour);
  const isInOperatingHours = now >= openTime && now < closeTime;
  const isOpen = isInOperatingHours && config.workstationsEnabled;

  let progress = 0;
  if (isInOperatingHours) {
    const total = closeTime.getTime() - openTime.getTime();
    const elapsed = now.getTime() - openTime.getTime();
    progress = total > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / total) * 100))) : 0;
  }

  const timeString = getLabCurrentTimeInBangkok(now);
  const dateString = getLabCurrentDateInBangkok(now);

  let minutesUntilClose = 0;
  let minutesUntilOpen = 0;
  if (isInOperatingHours) {
    minutesUntilClose = Math.max(0, Math.round((closeTime.getTime() - now.getTime()) / 60000));
  } else if (now < openTime) {
    minutesUntilOpen = Math.max(0, Math.round((openTime.getTime() - now.getTime()) / 60000));
  }

  return {
    isOpen,
    isInOperatingHours,
    workstationsEnabled: config.workstationsEnabled,
    openHour: config.openHour,
    closeHour: config.closeHour,
    hoursDisplay: formatLabHoursRange(config.openHour, config.closeHour),
    openTime,
    closeTime,
    progress,
    timeString,
    dateString,
    minutesUntilClose,
    minutesUntilOpen,
  };
}

export function isLabOpenAt(date: Date, customConfig?: LabConfig) {
  const config = customConfig ?? getLabConfig();
  if (!config.workstationsEnabled) return false;
  return date >= getLabTimeOnDate(date, config.openHour) && date < getLabTimeOnDate(date, config.closeHour);
}

export function isWithinOperatingHours(date: Date, customConfig?: LabConfig) {
  const config = customConfig ?? getLabConfig();
  return date >= getLabTimeOnDate(date, config.openHour) && date < getLabTimeOnDate(date, config.closeHour);
}

export function getLabSessionEndTime(start: Date, durationHours: number, customConfig?: LabConfig) {
  const config = customConfig ?? getLabConfig();
  return new Date(Math.min(
    start.getTime() + durationHours * 3600000,
    getLabTimeOnDate(start, config.closeHour).getTime(),
  ));
}

export function getLabReservationActivationDeadline(start: Date, customConfig?: LabConfig) {
  const config = customConfig ?? getLabConfig();
  return new Date(Math.min(
    start.getTime() + 20 * 60000,
    getLabTimeOnDate(start, config.closeHour).getTime(),
  ));
}
