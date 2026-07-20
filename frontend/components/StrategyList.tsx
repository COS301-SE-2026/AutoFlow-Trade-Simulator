'use client';

import { useState, useMemo } from 'react';
import { StrategyCard } from '@/components/StrategyCard';
import { StrategyDetail } from '@/components/StrategyDetail';
import { useStrategies } from '@/hooks/useStrategies';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function StrategyList() {
    const { strategies, loading, error } = useStrategies();
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [levelFilter, setLevelFilter] = useState<"All" | "Beginner" | "Intermediate" | "Advanced">('All');

    const selectedStrategy = selectedId;

    const filteredStrategies = useMemo(() => {
        let temp = strategies;
        if (temp === null) {
            temp = [];
        }

        if (levelFilter !== "All") {
            temp = temp.filter(t => t.level.toLocaleLowerCase().includes(levelFilter.toLocaleLowerCase()));
        }

        return temp;
    }, [strategies, levelFilter]);


    return (
        <div>
            <Select
                value={levelFilter}
                onValueChange={(value: "All" | "Beginner" | "Intermediate" | "Advanced") => setLevelFilter(value)}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value='All'>All</SelectItem>
                    <SelectItem value='Beginner'>Beginner</SelectItem>
                    <SelectItem value='Intermediate'>Intermediate</SelectItem>
                    <SelectItem value='Advanced'>Advanced</SelectItem>
                </SelectContent>
            </Select>
            <div>
                {filteredStrategies.map((s, index) => (
                    <StrategyCard
                        key={`empty-${index}`}
                        strategy={s}
                        onClick={() => setSelectedId(s.id)}
                    />
                ))}
            </div>
            <div>
                {selectedStrategy && (
                    <StrategyDetail
                        id={selectedStrategy}
                        onClose={() => setSelectedId(null)}
                    />
                )}
            </div>
        </div>
    );
}