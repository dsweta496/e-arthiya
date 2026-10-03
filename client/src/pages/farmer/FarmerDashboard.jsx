import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    getFarmerLots,
    getFarmerSupplyIntents,
} from "../../api/farmerApi";

function FarmerDashboard({ user = null }) {
    const farmerName = user?.name?.split(" ")[0] || "Farmer";

    const [lots, setLots] = useState([]);
    const [supplyIntents, setSupplyIntents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSupply = async () => {
            try {
                const farmerId = user?.id || user?._id;

                if (!farmerId) {
                    return;
                }

                setLoading(true);

                const [lotsResponse, intentsResponse] = await Promise.all([
                    getFarmerLots(farmerId),
                    getFarmerSupplyIntents(farmerId),
                ]);

                setLots(extractRecords(lotsResponse));
                setSupplyIntents(extractRecords(intentsResponse));
            } catch (error) {
                console.error("Failed to load farmer dashboard supply:", error);
            } finally {
                setLoading(false);
            }
        };

        loadSupply();
    }, [user?.id, user?._id]);

    const supplyRecords = useMemo(() => {
        const spot = lots.map((lot) => ({
            id: lot._id,
            crop: lot.crop || "Unknown crop",
            quantity: Number(lot.quantity || 0),
            unit: lot.unit || "quintal",
            status: lot.status || "available",
            type: "spot",
            date: lot.availableFrom || lot.harvestDate,
            price: lot.expectedPrice,
        }));

        const future = supplyIntents.map((intent) => ({
            id: intent._id,
            crop: intent.crop || "Unknown crop",
            quantity: Number(intent.expectedQuantity || 0),
            unit: intent.unit || "quintal",
            status: intent.status || "draft",
            type: "preorder",
            date: intent.expectedHarvestDate,
            price: null,
        }));

        return [...spot, ...future];
    }, [lots, supplyIntents]);

    const availableQuantity = useMemo(() => {
        return supplyRecords
            .filter(
                (record) =>
                    record.status === "available" ||
                    record.status === "partially_committed"
            )
            .reduce((total, record) => total + record.quantity, 0);
    }, [supplyRecords]);

    const marketValue = useMemo(() => {
        return supplyRecords.reduce((total, record) => {
            if (!record.price) return total;

            return total + record.quantity * Number(record.price);
        }, 0);
    }, [supplyRecords]);

    const dashboardSupply = useMemo(() => {
        return supplyRecords.slice(0, 3);
    }, [supplyRecords]);
    return (
        <div className="space-y-7">
            {/* ------------------------------------------------ */}
            {/* HEADER */}
            {/* ------------------------------------------------ */}

            <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />

                        <span className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                            Farmer workspace
                        </span>
                    </div>

                    <h1 className="text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl">
                        Good morning, {farmerName}.
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                        Keep track of your harvest, discover buyer demand and turn your
                        available supply into better market opportunities.
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

            {/* ------------------------------------------------ */}
            {/* QUICK STATS */}
            {/* ------------------------------------------------ */}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Available supply"
                    value={loading ? "—" : formatNumber(availableQuantity)}
                    unit="quintal"
                    detail="Ready for matching"
                    icon={<PackageIcon />}
                />

                <StatCard
                    label="Buyer demand"
                    value="—"
                    unit="requests"
                    detail="Demand matching is next"
                    icon={<TargetIcon />}
                />

                <StatCard
                    label="Active commitments"
                    value="—"
                    unit="deals"
                    detail="Farmer-specific API pending"
                    icon={<HandshakeIcon />}
                />

                <StatCard
                    label="Market value"
                    value={
                        loading
                            ? "—"
                            : marketValue > 0
                                ? `₹${formatCompactCurrency(marketValue)}`
                                : "—"
                    }
                    unit=""
                    detail="Across listed supply"
                    icon={<TrendingIcon />}
                />
            </section>

            {/* ------------------------------------------------ */}
            {/* MAIN GRID */}
            {/* ------------------------------------------------ */}

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
                {/* Supply overview */}
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                Your supply
                            </p>

                            <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                                Active harvests
                            </h2>
                        </div>

                        <Link
                            to="/farmer/supply"
                            className="text-xs font-bold text-emerald-800 transition hover:text-emerald-950"
                        >
                            View all →
                        </Link>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {loading ? (
                            <div className="px-6 py-10 text-center text-sm font-semibold text-slate-400">
                                Loading your supply...
                            </div>
                        ) : dashboardSupply.length === 0 ? (
                            <div className="px-6 py-10 text-center">
                                <p className="text-sm font-semibold text-slate-700">
                                    No supply listed yet.
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    Add your first supply to start matching with buyers.
                                </p>
                            </div>
                        ) : (
                            dashboardSupply.map((record) => (
                                <SupplyRow
                                    key={`${record.type}-${record.id}`}
                                    crop={record.crop}
                                    quantity={`${formatNumber(record.quantity)} ${record.unit}`}
                                    status={formatSupplyStatus(record.status, record.type)}
                                    statusType={getSupplyStatusType(record.status, record.type)}
                                    date={formatDashboardDate(record.date, record.type)}
                                    price={
                                        record.price
                                            ? `₹${formatNumber(record.price)} / q`
                                            : "—"
                                    }
                                />
                            ))
                        )}
                    </div>

                    <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
                        <Link
                            to="/farmer/supply/add"
                            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                        >
                            <PlusIcon />
                            Add another supply
                        </Link>
                    </div>
                </div>

                {/* Demand panel */}
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-emerald-950 text-white shadow-sm">
                    <div className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-300">
                                    Buyer demand
                                </p>

                                <h2 className="mt-2 text-xl font-bold tracking-tight">
                                    Demand that matches you
                                </h2>
                            </div>

                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                                <TargetIcon />
                            </span>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-emerald-100/75">
                            Buyers are currently looking for produce that matches your
                            available supply.
                        </p>

                        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold">Tomato Hybrid</span>

                                <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-bold text-emerald-200">
                                    MATCH
                                </span>
                            </div>

                            <div className="mt-4 flex items-end justify-between">
                                <div>
                                    <p className="text-2xl font-bold">15 q</p>
                                    <p className="mt-1 text-xs text-emerald-100/60">
                                        Buyer requirement
                                    </p>
                                </div>

                                <div className="text-right">
                                    <p className="text-sm font-bold">₹2,600 / q</p>
                                    <p className="mt-1 text-xs text-emerald-100/60">
                                        Offered range
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Link
                            to="/farmer/demand"
                            className="mt-5 flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-emerald-950 transition hover:bg-emerald-50"
                        >
                            Explore buyer demand
                            <span className="ml-2">→</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ------------------------------------------------ */}
            {/* LOWER GRID */}
            {/* ------------------------------------------------ */}

            <section className="grid gap-6 lg:grid-cols-2">
                {/* Protected commitments */}
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                Trade protection
                            </p>

                            <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                                Recent commitments
                            </h2>
                        </div>

                        <Link
                            to="/farmer/commitments"
                            className="text-xs font-bold text-emerald-800"
                        >
                            View all →
                        </Link>
                    </div>

                    <div className="mt-5 space-y-3">
                        <CommitmentRow
                            crop="Tomato Hybrid"
                            buyer="Buyer #2048"
                            amount="₹52,000"
                            status="Deposit confirmed"
                        />

                        <CommitmentRow
                            crop="Mustard"
                            buyer="Buyer #1972"
                            amount="₹64,800"
                            status="Active"
                        />

                        <CommitmentRow
                            crop="Wheat"
                            buyer="Buyer #2134"
                            amount="₹78,750"
                            status="Awaiting delivery"
                        />
                    </div>
                </div>

                {/* How it works */}
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                        Marketplace flow
                    </p>

                    <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                        From harvest to market
                    </h2>

                    <div className="mt-6 space-y-5">
                        <FlowStep
                            number="01"
                            title="List your supply"
                            description="Tell buyers what you can supply and when."
                        />

                        <FlowStep
                            number="02"
                            title="Get matched"
                            description="Your supply is matched with relevant demand."
                        />

                        <FlowStep
                            number="03"
                            title="Trade with protection"
                            description="Commitments and deposits protect the transaction."
                        />
                    </div>
                </div>
            </section>

            {/* ------------------------------------------------ */}
            {/* FOOTER INSIGHT */}
            {/* ------------------------------------------------ */}

            <section className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-900 text-white">
                            <ShieldIcon />
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-emerald-950">
                                Your trades are protected
                            </h3>

                            <p className="mt-1 max-w-2xl text-xs leading-5 text-emerald-900/65">
                                e-Arthiya uses protected commitments and buyer deposits to
                                reduce the risk of last-minute cancellations.
                            </p>
                        </div>
                    </div>

                    <Link
                        to="/farmer/commitments"
                        className="shrink-0 text-sm font-bold text-emerald-900"
                    >
                        See commitments →
                    </Link>
                </div>
            </section>
        </div>
    );
}
function extractRecords(response) {
    if (Array.isArray(response)) return response;

    if (Array.isArray(response?.data)) {
        return response.data;
    }

    if (Array.isArray(response?.data?.data)) {
        return response.data.data;
    }

    return [];
}

function formatNumber(value) {
    return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2,
    }).format(Number(value || 0));
}

function formatCompactCurrency(value) {
    const amount = Number(value || 0);

    if (amount >= 10000000) {
        return `${(amount / 10000000).toFixed(1)}Cr`;
    }

    if (amount >= 100000) {
        return `${(amount / 100000).toFixed(1)}L`;
    }

    if (amount >= 1000) {
        return `${(amount / 1000).toFixed(1)}K`;
    }

    return formatNumber(amount);
}

function formatDashboardDate(value, type) {
    if (!value) {
        return type === "spot" ? "Available now" : "Future harvest";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return type === "preorder"
        ? `Harvest · ${date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
        })}`
        : `Available · ${date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
        })}`;
}

function formatSupplyStatus(status, type) {
    if (status === "available") return "Available";
    if (status === "committed") return "Committed";
    if (status === "partially_committed") return "Partially committed";
    if (status === "reserved") return "Reserved";
    if (status === "cancelled") return "Cancelled";

    if (type === "preorder" && status === "draft") {
        return "Draft";
    }

    if (type === "preorder" && status === "available") {
        return "Preorder";
    }

    return status || "Unknown";
}

function getSupplyStatusType(status, type) {
    if (
        status === "committed" ||
        status === "partially_committed"
    ) {
        return "committed";
    }

    if (status === "available" && type === "preorder") {
        return "preorder";
    }

    if (status === "available") {
        return "available";
    }

    return "preorder";
}

/* ====================================================== */
/* STAT CARD */
/* ====================================================== */

function StatCard({ label, value, unit, detail, icon }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                    {icon}
                </span>

                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Live
                </span>
            </div>

            <div className="mt-5 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-slate-950">
                    {value}
                </span>

                {unit && (
                    <span className="text-xs font-semibold text-slate-400">{unit}</span>
                )}
            </div>

            <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>

            <p className="mt-1 text-xs text-slate-400">{detail}</p>
        </div>
    );
}

/* ====================================================== */
/* SUPPLY ROW */
/* ====================================================== */

function SupplyRow({
    crop,
    quantity,
    status,
    statusType,
    date,
    price,
}) {
    const statusClasses = {
        available: "bg-emerald-50 text-emerald-700",
        preorder: "bg-amber-50 text-amber-700",
        committed: "bg-blue-50 text-blue-700",
    };

    return (
        <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-emerald-800">
                    <PackageIcon />
                </div>

                <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{crop}</p>

                    <p className="mt-0.5 text-xs text-slate-400">
                        {quantity} · {date}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between gap-5 sm:justify-end">
                <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClasses[statusType]}`}
                >
                    {status}
                </span>

                <span className="text-sm font-bold text-slate-800">{price}</span>
            </div>
        </div>
    );
}

/* ====================================================== */
/* COMMITMENT ROW */
/* ====================================================== */

function CommitmentRow({ crop, buyer, amount, status }) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-800 shadow-sm">
                <HandshakeIcon />
            </div>

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-800">{crop}</p>

                <p className="mt-0.5 text-xs text-slate-400">
                    {buyer} · {status}
                </p>
            </div>

            <span className="text-sm font-bold text-slate-800">{amount}</span>
        </div>
    );
}

/* ====================================================== */
/* FLOW STEP */
/* ====================================================== */

function FlowStep({ number, title, description }) {
    return (
        <div className="flex gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-900 text-[10px] font-bold text-white">
                {number}
            </div>

            <div>
                <p className="text-sm font-bold text-slate-900">{title}</p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                    {description}
                </p>
            </div>
        </div>
    );
}

/* ====================================================== */
/* ICONS */
/* ====================================================== */

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

function TargetIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 fill-none stroke-current stroke-[1.8]"
        >
            <circle cx="12" cy="12" r="8" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="12" cy="12" r="1" />
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

function TrendingIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 fill-none stroke-current stroke-[1.8]"
        >
            <path d="m3 17 6-6 4 4 8-9" />
            <path d="M15 6h6v6" />
        </svg>
    );
}

function ShieldIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 fill-none stroke-current stroke-[1.8]"
        >
            <path d="M12 3 20 6v5c0 5-3.3 8.5-8 10-4.7-1.5-8-5-8-10V6l8-3Z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}

export default FarmerDashboard;