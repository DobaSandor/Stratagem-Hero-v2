// Placeholder for Truth Enforcers Shop Items
// "Papers Please" style upgrades.

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    cost: number;
}

export const shopItems: ShopItem[] = [
    {
        id: 'auto-check',
        name: 'Auto-Checker',
        description: 'Automatically highlights discrepancies.',
        cost: 100
    },
    // Add more items
];
