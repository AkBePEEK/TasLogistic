import React from 'react';

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="h-24 animate-pulse rounded-xl border border-gray-100 bg-gray-50"
                />
            ))}
        </div>
    );
}