import { jsx as _jsx } from "react/jsx-runtime";
export function LoadingSkeleton({ rows = 3 }) {
    return (_jsx("div", { className: "space-y-3", children: Array.from({ length: rows }).map((_, i) => (_jsx("div", { className: "h-24 animate-pulse rounded-xl border border-gray-100 bg-gray-50" }, i))) }));
}
