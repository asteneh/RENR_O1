export interface RequestItem {
    id: string;
    title: string;          // e.g. "2 Excavators Required"
    status: 'Open' | 'In Progress' | 'Fulfilled';
    projectName: string;
    siteLocation: string;
    machineType: string;
    quantity: number;
    yearRequirement?: string; // e.g. "2018 or newer"
    description: string;
    datePosted: string;
}

export const MOCK_REQUESTS: RequestItem[] = [
    {
        id: 'req-1',
        title: '2 Excavators Required',
        status: 'Open',
        projectName: 'Site 1 Expansion',
        siteLocation: 'Addis Ababa, Bole',
        machineType: 'Excavator',
        quantity: 2,
        yearRequirement: '2019+',
        description: 'Need two CAT 320 or equivalent excavators for foundation digging. Duration: 3 months.',
        datePosted: '2025-12-14'
    },
    {
        id: 'req-2',
        title: 'Bulldozer for Road Work',
        status: 'In Progress',
        projectName: 'Ring Road Maintenance',
        siteLocation: 'Kality, Zone 3',
        machineType: 'Bulldozer',
        quantity: 1,
        yearRequirement: 'Any',
        description: 'D8 Dozer needed for grading work.',
        datePosted: '2025-12-10'
    },
    {
        id: 'req-3',
        title: 'Crane - 50 Ton',
        status: 'Open',
        projectName: 'High Rise Block B',
        siteLocation: 'Kazanchis',
        machineType: 'Mobile Crane',
        quantity: 1,
        yearRequirement: '2020+',
        description: 'Urgent need for a 50T mobile crane for steel erection.',
        datePosted: '2025-12-15'
    }
];
