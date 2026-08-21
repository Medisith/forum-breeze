import { cn } from '@/lib/utils';

export type HomeTab = 'environment' | 'social';

const TABS: Array<{ value: HomeTab; label: string }> = [
    { value: 'environment', label: 'Meio ambiente' },
    { value: 'social', label: 'Social' },
];

export function HomeTabs({
    active,
    onChange,
}: {
    active: HomeTab;
    onChange: (tab: HomeTab) => void;
}) {
    return (
        <div
            role="tablist"
            aria-label="Seções brasileiras"
            className="bg-muted inline-flex w-fit items-center gap-1 rounded-lg p-1"
        >
            {TABS.map(({ value, label }) => {
                const selected = active === value;

                return (
                    <button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => onChange(value)}
                        className={cn(
                            'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                            selected
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
}
