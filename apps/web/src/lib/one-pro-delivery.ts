const ONE_PRO_DELIVERY_TIME_ZONE = "America/New_York";

export function formatOneProTargetDeliveryDate(fromDate = new Date()) {
    const sourceParts = getDatePartsInTimeZone(fromDate);
    const targetYear = sourceParts.year + 1;
    const targetDay = Math.min(sourceParts.day, getDaysInMonth(targetYear, sourceParts.month));
    const targetDate = new Date(Date.UTC(targetYear, sourceParts.month - 1, targetDay, 12));

    return new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    }).format(targetDate);
}

function getDatePartsInTimeZone(date: Date) {
    const parts = new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "numeric",
        timeZone: ONE_PRO_DELIVERY_TIME_ZONE,
        year: "numeric",
    }).formatToParts(date);

    return {
        day: Number(parts.find(part => part.type === "day")?.value),
        month: Number(parts.find(part => part.type === "month")?.value),
        year: Number(parts.find(part => part.type === "year")?.value),
    };
}

function getDaysInMonth(year: number, month: number) {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
