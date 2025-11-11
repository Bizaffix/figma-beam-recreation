export type CalendarInfo = {
  title: string;
  description?: string;
  location?: string;
  // date string from retreat data e.g. "Nov 5-8, 2025"
  dateRange?: string;
  // optional attendee email
  email?: string;
};

// Parse date strings like "Nov 5-8, 2025" or "Dec 12-15, 2025"
function parseDateRange(dateRange?: string) {
  if (!dateRange) return null;
  // Expect formats like: "Nov 5-8, 2025" or "Jan 15-18, 2026"
  try {
    const parts = dateRange.split(",");
    const year = parts[1]?.trim();
    const monthAndDays = parts[0].trim(); // "Nov 5-8"
    const [monthStr, days] = monthAndDays.split(" ");
    if (!monthStr || !days || !year) return null;

    const dayParts = days.split("-");
    const startDay = dayParts[0];
    const endDay = dayParts[1] ?? startDay;

    // Assume local times: start 09:00, end 17:00
    const start = new Date(`${monthStr} ${startDay} ${year} 09:00`);
    const end = new Date(`${monthStr} ${endDay} ${year} 17:00`);
    return { start, end };
  } catch (e) {
    return null;
  }
}

function formatDateToICS(date: Date) {
  // ICS requires UTC in format YYYYMMDDTHHMMSSZ
  const iso = date.toISOString();
  return iso.replace(/[-:]/g, "").split(".")[0] + "Z";
}

function makeICSEvent(info: CalendarInfo) {
  const { start, end } = parseDateRange(info.dateRange) ?? { start: new Date(), end: new Date() };

  const dtStart = formatDateToICS(start);
  const dtEnd = formatDateToICS(end);
  const uid = `retreat-${Date.now()}@example.com`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//retreat-app//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatDateToICS(new Date())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICSText(info.title)}`,
    `DESCRIPTION:${escapeICSText(info.description ?? "")}`,
    `LOCATION:${escapeICSText(info.location ?? "")}`,
  ];

  if (info.email) {
    lines.push(`ATTENDEE:MAILTO:${info.email}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n");
}

function escapeICSText(text: string) {
  return text.replace(/\n/g, "\\n").replace(/,/g, "\\,");
}

export function createICSBlob(info: CalendarInfo) {
  const content = makeICSEvent(info);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  return blob;
}

export function createGoogleCalendarUrl(info: CalendarInfo) {
  const parsed = parseDateRange(info.dateRange);
  const start = parsed ? formatDateToICS(parsed.start) : formatDateToICS(new Date());
  const end = parsed ? formatDateToICS(parsed.end) : formatDateToICS(new Date(Date.now() + 3600 * 1000));

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: info.title,
    dates: `${start}/${end}`,
    details: info.description ?? "",
    location: info.location ?? "",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Helper to trigger download in browser
export function downloadICS(info: CalendarInfo, filename?: string) {
  const blob = createICSBlob(info);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `${info.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export default {
  createICSBlob,
  createGoogleCalendarUrl,
  downloadICS,
};
