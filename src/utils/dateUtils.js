import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toZonedTime } from 'date-fns-tz';

export function formatDateCalendar(value) {
    if (!value) return "";
    return format(new Date(value), "eeee, d MMMM yyyy", { locale: it });
}
export function formatTime(value) {
    return value ? format(new Date(value), "HH:mm") : "";
}

export function formatDateTimeCalendar(value) {
    if (!value) return "";
    return format(new Date(value), "eeee, d MMMM yyyy HH:mm", { locale: it });
}

export function formatDateIso(value) {
    if (!value) return "";
    return format(new Date(value), "yyyy-MM-dd");
}

export function formatDate(value) {
    if (!value) return "";
    return format(new Date(value), "dd.MM.yyyy");
}

export function formatDateTime(date, time) {
    if (!date || !time) return "";
    return format(new Date(`${date}T${time}`), "dd.MM.yyyy HH:mm");
};

export function formatUtcToCest(value) {
    if (!value) return null;
    const utcDate = new Date(value + "Z");
    return toZonedTime(utcDate, 'Europe/Berlin');
}

const TZ = "Europe/Rome";

export function isAllDay(start, end) {
    const startRome = toZonedTime(new Date(start), TZ);
    const endRome = toZonedTime(new Date(end), TZ);

    const startIsMidnight =
        startRome.getHours() === 0 &&
        startRome.getMinutes() === 0 &&
        startRome.getSeconds() === 0;

    const endIsMidnight =
        endRome.getHours() === 0 &&
        endRome.getMinutes() === 0 &&
        endRome.getSeconds() === 0;

    return startIsMidnight && endIsMidnight;
};