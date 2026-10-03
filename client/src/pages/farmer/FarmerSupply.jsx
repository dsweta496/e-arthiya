import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getFarmerLots, getFarmerSupplyIntents } from "../../api/farmerApi";

function FarmerSupply({ user = null }) {
    const [lots, setLots] = useState([]);
    const [supplyIntents, setSupplyIntents] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        const loadSupply = async () => {
            try {
                setLoading(true);
                setError("");

                const farmerId = user?.id || user?._id;

                if (!farmerId) {
                    throw new Error("Farmer account could not be identified.");
                }

                const [lotsResponse, intentsResponse] = await Promise.all([
                    getFarmerLots(farmerId),
                    getFarmerSupplyIntents(farmerId),
                ]);

                setLots(extractRecords(lotsResponse));
                setSupplyIntents(extractRecords(intentsResponse));
            } catch (requestError) {
                setError(
                    requestError.message ||
                    "Unable to load your supply right now."
                );
            } finally {
                setLoading(false);
            }
        };

        loadSupply();
    }, [user?.id, user?._id]);

    const supplyRecords = useMemo(() => {
        const spotRecords = lots.map((lot) => ({
            id: lot._id,
            source: "lot",
            crop: lot.crop || "Unknown crop",
            variety: lot.variety || "—",
            quantity: Number(lot.quantity || 0),
            unit: lot.unit || "quintal",
            location: formatLocation(lot.location),
            availability: lot.availableFrom
                ? formatDate(lot.availableFrom)
                : "Available now",
            type: "Spot supply",
            status: formatLotStatus(lot.status),
            statusType: mapStatusType(lot.status),
            price: lot.pricePerUnit
                ? `₹${formatNumber(lot.pricePerUnit)} / ${shortUnit(lot.unit)}`
                : "—",
            rawStatus: lot.status,
        }));

        const futureRecords = supplyIntents.map((intent) => ({
            id: intent._id,
            source: "supply_intent",
            crop: intent.crop || "Unknown crop",
            variety: intent.variety || "—",
            quantity: Number(intent.expectedQuantity || 0),
            unit: intent.unit || "quintal",
            location: formatLocation(intent.location),
            availability: intent.expectedHarvestDate
                ? `Harvest · ${formatDate(intent.expectedHarvestDate)}`
                : "Future harvest",
            type: "Future supply",
            status: formatIntentStatus(intent.status),
            statusType: mapIntentStatusType(intent.status),
            price: "—",
            rawStatus: intent.status,
        }));

        return [...spotRecords, ...futureRecords];
    }, [lots, supplyIntents]);

    const filteredRecords = useMemo(() => {
        const query = search.trim().toLowerCase();

        return supplyRecords.filter((record) => {
            const matchesSearch =
                !query ||
                record.crop.toLowerCase().includes(query) ||
                record.variety.toLowerCase().includes(query) ||
                record.location.toLowerCase().includes(query);

            if (!matchesSearch) return false;

            if (filter === "available") {
                return record.statusType === "available";
            }

            if (filter === "preorder") {
                return record.source === "supply_intent";
            }

            if (filter === "committed") {
                return record.statusType === "committed";
            }

            return true;
        });
    }, [supplyRecords, search, filter]);

    const summary = useMemo(() => {
        const total = supplyRecords.reduce(
            (sum, record) => sum + record.quantity,
            0
        );

        const available = supplyRecords
            .filter((record) => record.statusType === "available")
            .reduce((sum, record) => sum + record.quantity, 0);

        const preorder = supplyRecords
            .filter((record) => record.source === "supply_intent")
            .reduce((sum, record) => sum + record.quantity, 0);

        const committed = supplyRecords
            .filter((record) => record.statusType === "committed")
            .reduce((sum, record) => sum + record.quantity, 0);

        return {
            total,
            available,
            preorder,
            committed,
        };
    }, [supplyRecords]);

    return (
        <div className="space-y-7">

            {/* HEADER */}
            <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />

                        <span className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                            Farmer workspace
                        </span>
                    </div>

                    <h1 className="text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl">
                        My supply
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                        Manage your available harvests and future supply, and see how each
                        lot is moving through the marketplace.
                    </p>
                </div>

                <Link
                    to="/farmer/supply/add"
                    className="inline-flex w-fit items-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-950"
                >
                    <PlusIcon />
                    Add supply
                </Link>
            </section>

            {/* ERROR */}
            {error && (
                <section className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                </section>
            )}

            {/* SUMMARY */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    label="Total supply"
                    value={formatNumber(summary.total)}
                    unit="quintal"
                    icon={<PackageIcon />}
                />

                <SummaryCard
                    label="Available"
                    value={formatNumber(summary.available)}
                    unit="quintal"
                    icon={<CheckIcon />}
                />

                <SummaryCard
                    label="Preorder"
                    value={formatNumber(summary.preorder)}
                    unit="quintal"
                    icon={<CalendarIcon />}
                />

                <SummaryCard
                    label="Committed"
                    value={formatNumber(summary.committed)}
                    unit="quintal"
                    icon={<HandshakeIcon />}
                />
            </section>

            {/* FILTER BAR */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative w-full lg:max-w-sm">
                        <SearchIcon />

                        <input
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search your supply..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <FilterButton
                            label="All"
                            active={filter === "all"}
                            onClick={() => setFilter("all")}
                        />

                        <FilterButton
                            label="Available"
                            active={filter === "available"}
                            onClick={() => setFilter("available")}
                        />

                        <FilterButton
                            label="Preorder"
                            active={filter === "preorder"}
                            onClick={() => setFilter("preorder")}
                        />

                        <FilterButton
                            label="Committed"
                            active={filter === "committed"}
                            onClick={() => setFilter("committed")}
                        />
                    </div>
                </div>
            </section>

            {/* SUPPLY LIST */}
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                Supply inventory
                            </p>

                            <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                                Your listed supply
                            </h2>
                        </div>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                            {filteredRecords.length}{" "}
                            {filteredRecords.length === 1 ? "record" : "records"}
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center px-6 py-16">
                        <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
                            <SpinnerIcon />
                            Loading your supply...
                        </div>
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                            <PackageIcon />
                        </div>

                        <h3 className="mt-4 text-sm font-bold text-slate-900">
                            No supply found
                        </h3>

                        <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
                            {search || filter !== "all"
                                ? "Try changing your search or filter."
                                : "Add your first supply listing to start matching with buyers."}
                        </p>

                        {!search && filter === "all" && (
                            <Link
                                to="/farmer/supply/add"
                                className="mt-5 inline-flex rounded-xl bg-emerald-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-950"
                            >
                                Add supply
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredRecords.map((record) => (
                            <SupplyCard
                                key={`${record.source}-${record.id}`}
                                {...record}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* INFORMATION BANNER */}
            <section className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-900 text-white">
                        <InfoIcon />
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-emerald-950">
                            Two ways to list your produce
                        </h3>

                        <div className="mt-3 grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-xs font-bold text-emerald-900">
                                    Spot supply
                                </p>

                                <p className="mt-1 text-xs leading-5 text-emerald-900/60">
                                    Produce that has already been harvested or is immediately
                                    available for matching.
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-emerald-900">
                                    Future supply
                                </p>

                                <p className="mt-1 text-xs leading-5 text-emerald-900/60">
                                    Upcoming harvest that buyers can reserve through a preorder
                                    commitment.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

/* ======================================================
   HELPERS
====================================================== */

function extractRecords(response) {
    if (Array.isArray(response)) return response;

    if (Array.isArray(response?.data)) {
        return response.data;
    }

    if (Array.isArray(response?.data?.data)) {
        return response.data.data;
    }

    if (Array.isArray(response?.data?.items)) {
        return response.data.items;
    }

    if (Array.isArray(response?.items)) {
        return response.items;
    }

    if (Array.isArray(response?.lots)) {
        return response.lots;
    }

    if (Array.isArray(response?.supplyIntents)) {
        return response.supplyIntents;
    }

    return [];
}

function formatLocation(location) {
    if (!location) return "—";

    if (typeof location === "string") {
        return location;
    }

    return [
        location.village,
        location.district,
        location.state,
    ]
        .filter(Boolean)
        .join(", ") || "—";
}

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatNumber(value) {
    return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2,
    }).format(Number(value || 0));
}

function shortUnit(unit) {
    if (unit === "quintal") return "q";
    if (unit === "kilogram" || unit === "kg") return "kg";
    if (unit === "ton") return "t";
    return unit || "unit";
}

function formatLotStatus(status) {
    const labels = {
        available: "Available",
        reserved: "Reserved",
        committed: "Committed",
        partially_committed: "Partially committed",
        sold: "Sold",
        cancelled: "Cancelled",
    };

    return labels[status] || status || "Unknown";
}

function formatIntentStatus(status) {
    const labels = {
        draft: "Draft",
        available: "Preorder",
        committed: "Committed",
        converted: "Converted",
        cancelled: "Cancelled",
    };

    return labels[status] || status || "Unknown";
}

function mapStatusType(status) {
    if (
        status === "committed" ||
        status === "partially_committed"
    ) {
        return "committed";
    }

    if (status === "available") {
        return "available";
    }

    return "other";
}

function mapIntentStatusType(status) {
    if (status === "committed") {
        return "committed";
    }

    if (status === "available") {
        return "preorder";
    }

    return "other";
}

/* ======================================================
   SUMMARY CARD
====================================================== */

function SummaryCard({ label, value, unit, icon }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                {icon}
            </span>

            <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-slate-950">
                    {value}
                </span>

                <span className="text-xs font-semibold text-slate-400">
                    {unit}
                </span>
            </div>

            <p className="mt-1 text-sm font-semibold text-slate-700">
                {label}
            </p>
        </div>
    );
}

/* ======================================================
   FILTER BUTTON
====================================================== */

function FilterButton({ label, active = false, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "rounded-xl px-3.5 py-2 text-xs font-semibold transition",
                active
                    ? "bg-emerald-900 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-800",
            ].join(" ")}
        >
            {label}
        </button>
    );
}

/* ======================================================
   SUPPLY CARD
====================================================== */

function SupplyCard({
    crop,
    variety,
    quantity,
    unit,
    location,
    availability,
    type,
    status,
    statusType,
    price,
}) {
    const statusClasses = {
        available: "bg-emerald-50 text-emerald-700",
        preorder: "bg-amber-50 text-amber-700",
        committed: "bg-blue-50 text-blue-700",
        other: "bg-slate-100 text-slate-600",
    };

    return (
        <div className="p-5 sm:px-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center">

                {/* Crop */}
                <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                        <PackageIcon />
                    </div>

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900">
                                {crop}
                            </h3>

                            <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClasses[statusType] || statusClasses.other
                                    }`}
                            >
                                {status}
                            </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-400">
                            {variety} · {type}
                        </p>
                    </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs sm:grid-cols-4 lg:w-[560px] lg:grid-cols-4">
                    <Detail
                        label="Quantity"
                        value={`${formatNumber(quantity)} ${unit}`}
                    />

                    <Detail
                        label="Location"
                        value={location}
                    />

                    <Detail
                        label="Availability"
                        value={availability}
                    />

                    <Detail
                        label="Indicative price"
                        value={price}
                        highlight
                    />
                </div>

                {/* Action */}
                <Link
                    to="/farmer/supply"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                >
                    View details
                </Link>
            </div>
        </div>
    );
}

function Detail({ label, value, highlight = false }) {
    return (
        <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                {label}
            </p>

            <p
                className={[
                    "mt-1 font-semibold",
                    highlight ? "text-emerald-800" : "text-slate-700",
                ].join(" ")}
            >
                {value}
            </p>
        </div>
    );
}

/* ======================================================
   ICONS
====================================================== */

function PlusIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 fill-none stroke-current stroke-[2]"
        >
            <path d="M12 5v14M5 12h14" />
        </svg>
    );
}

function SearchIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 fill-none stroke-slate-400 stroke-[1.8]"
        >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
        </svg>
    );
}

function PackageIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 fill-none stroke-current stroke-[1.8]"
        >
            <path d="m21 8-9 5-9-5 9-5 9 5Z" />
            <path d="M3 8v8l9 5 9-5V8" />
            <path d="M12 13v8" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 fill-none stroke-current stroke-[1.8]"
        >
            <path d="m5 12 4 4L19 6" />
        </svg>
    );
}

function CalendarIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 fill-none stroke-current stroke-[1.8]"
        >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M7 3v4M17 3v4M3 10h18" />
        </svg>
    );
}

function HandshakeIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 fill-none stroke-current stroke-[1.8]"
        >
            <path d="m3 11 4-4 4 2 2-2 4 2 4-4" />
            <path d="m3 11 5 7 3-2 2 2 4-5 3 1 1-3" />
            <path d="m7 7 2-4 4 2 2-2 4 4" />
        </svg>
    );
}

function InfoIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 fill-none stroke-current stroke-[1.8]"
        >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5" />
            <path d="M12 8h.01" />
        </svg>
    );
}

function SpinnerIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 animate-spin fill-none stroke-current stroke-[2]"
        >
            <circle
                cx="12"
                cy="12"
                r="9"
                className="opacity-25"
            />
            <path d="M21 12a9 9 0 0 1-9 9" />
        </svg>
    );
}

export default FarmerSupply;