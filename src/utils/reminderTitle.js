const clean = (s) =>
    String(s ?? "")
        .replace(/\s+/g, " ")
        .trim();

const clip = (s, max = 70) => {
    const t = clean(s);
    return t.length > max ? t.slice(0, max - 1) + "…" : t;
};

const normalizeForMatch = (s) =>
    clean(s)
        .toLowerCase()
        .replace(/[’'".,;:()[\]{}_-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const includesName = (haystack, needle) => {
    const h = normalizeForMatch(haystack);
    const n = normalizeForMatch(needle);
    if (!h || !n) return false;
    return h.includes(n);
};

const noteSnippet = (content) => {
    const t = clean(content);
    if (!t) return "Note";
    return clip(t, 40);
};

export function getEntityDisplayName(entityType, entity) {
    if (!entity) return "";

    const type = (entityType || "").toLowerCase();

    switch (type) {
        case "clients":
        case "client":
            return clean(entity.legal_name || entity.name || "");

        case "allocations":
        case "allocation":
            return clean(entity.name || "");

        case "tenders":
        case "tender":
            return clean(entity.name || "");

        case "allocation_phases":
        case "allocation_phase":
            return clean(entity.name || "");

        case "notes":
        case "note":
            return noteSnippet(entity.content);

        default:
            return clean(entity.name || entity.title || entity.legal_name || "");
    }
}

const getClientNameFromAllocation = (allocation) => {
    if (!allocation) return "";

    const c = allocation.client?.legal_name || "";
    return clean(c);
};

export function buildReminderTitle({
   entityType,
   entity,
   parentType = null,
   parent = null,
}) {
    const t = (entityType || "").toLowerCase();
    const isNote = t === "notes" || t === "note";
    const isClient = t === "clients" || t === "client";
    const isTender = t === "tenders" || t === "tender";
    const isAllocation = t === "allocations" || t === "allocation";
    const isPhase =
        t === "allocation-phases" ||
        t === "allocation_phases" ||
        t === "allocation-phase" ||
        t === "allocation_phase" ||
        t.includes("phase");

    const mainName = getEntityDisplayName(entityType, entity);
    const parentName = getEntityDisplayName(parentType, parent);

    let clientName = "";

    if (isAllocation) {
        clientName = getClientNameFromAllocation(entity);
        const allocationName = mainName;

        const allocationAlreadyHasClient =
            clientName && includesName(allocationName, clientName);

        if (allocationName) {
            return clip(
                allocationAlreadyHasClient
                    ? `${allocationName}`
                    : `${clientName ? clientName + " • " : ""}${allocationName}`,
                80
            );
        }
        return clip(clientName || "Allocation", 80);
    }

    if (isPhase && (parentType || "").toLowerCase().includes("allocation")) {
        const allocationName = parentName;
        clientName = getClientNameFromAllocation(parent);

        const allocationAlreadyHasClient =
            clientName && includesName(allocationName, clientName);

        const parts = [];
        if (!allocationAlreadyHasClient && clientName) parts.push(clientName);
        if (allocationName) parts.push(allocationName);
        if (mainName) parts.push(mainName);

        return clip(parts.join(" • "), 80);
    }

    if (isNote) {
        if (parentName) return clip(`Note • ${parentName} • ${mainName}`, 80);
        return clip(`Note • ${mainName}`, 80);
    }

    if (isClient) return clip(mainName || "Client", 80);

    if (isTender) return clip(mainName || "Tender", 80);

    const typeLabel = clip(entityType || "Reminder", 20);
    if (mainName) return clip(`${typeLabel} • ${mainName}`, 80);
    return clip(typeLabel, 80);
}
