import type { StatusType } from "../shared/Status";

export type CategoryStatus = "All" | "Pending" | "Approved" | "Rejected";

export interface CategoryFilterProps {
    selectedCategory: CategoryStatus,
    onCategoryChange: (category: CategoryStatus) => void;
}

export interface SeearchFilterProps {
    searchQuery: string,
    onSearchChange: (query: string) => void;
    placeholder: string;
}


// ----------------- Grid Details -------------------------- 

export interface AgentReviewGridProps {
    id: number;
    image: string;
    name: string;
    title?: string;
    location: string;
    submission: string;
    status: StatusType;
    }
    
export interface ListReviewGridProps {
    id: number;
    image: string;
    title: string;
    location: string;
    intPrice: number;
    status: StatusType;
    }
// ----------------- Grid Details -------------------------- 
    
    
export interface list {
    id: string;
    image: string;
    title: string;
    location: string;
    intPrice: number;
    status: StatusType;
}

export interface agent {
    submission: Date | string;
    id: string;
    image: string;
    name: string;
    email: string;
    mobileNumber: string;
    title: string;
    location: string;
    status: StatusType;

}

export const listData: list[] = [
    {
        id: "1",
        image: "",
        title: "Three-bedroom townhome",
        location: "Quezon City",
        intPrice: 8500000,
        status: "pending"
    },
    {
        id: "2",
        image: "",
        title: "Ortigas Skyline Condo",
        location: "Pasig City",
        intPrice: 3200000,
        status: "pending"
    },
    {
        id: "3",
        image: "",
        title: "Garden-view family home",
        location: "San Juan",
        intPrice: 11900000,
        status: "pending"
    },
    {
        id: "4",
        image: "",
        title: "Makati Garden Residences",
        location: "Makati",
        intPrice: 9800000,
        status: "approved"
    },
    {
        id: "5",
        image: "",
        title: "Pasig Courtyard townhouse",
        location: "Pasig",
        intPrice: 7400000,
        status: "cancelled"
    },
]

export const Agents: agent[] = [
    {
        id: "1",
        image: '',
        name: "Xian Humping de los reyes",
        title: "PRC#0029182",
        location: "Naga City, PH",
        status: "pending",
        submission: "2026-11-19",
        email: "xianhumf@gmail.com",
        mobileNumber: "09284758371"
    },
    {
        id: "2",
        image: '',
        name: "Neil Anlene Villanueva",
        title: "PRC#0029183",
        location: "San Fernando City, PH",
        status: "approved",
        submission: "2026-11-19",
        email: "neilanlyvilla@gmail.com",
        mobileNumber: "09284758321"
    },
    {
        id: "3",
        image: '',
        name: "Syxied Sebven Abelado",
        title: "PRC#0029182",
        location: "Naga City, PH",
        status: "cancelled",
        submission: "2026-11-19",
        email: "drbbrnsdf@gmail.com",
        mobileNumber: "09284758374"
    },
    {
        id: "4",
        image: '',
        name: "Syxied Sebven Abelado",
        title: "PRC#0029182",
        location: "Naga City, PH",
        status: "cancelled",
        submission: "2026-11-19",
        email: "xianhumf@gmail.com",
        mobileNumber: "09284758371"
    },
    {
        id: "5",
        image: '',
        name: "Syxied Sebven Abelado",
        title: "PRC#0029182",
        location: "Naga City, PH",
        status: "cancelled",
        submission: "2026-11-19",
        email: "syxiedsebvenabelas@gmail.com",
        mobileNumber: "09284787371"
    },
]
