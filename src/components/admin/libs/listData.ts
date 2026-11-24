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
    id: string;
    image: string;
    name: string;
    title?: string;
    location: string;
    submission: string;
    status: StatusType;
    }
    
export interface ListReviewGridProps {
    id: string;
    image: string;
    title: string;
    location: string;
    intPrice: number;
    status: StatusType;
    }
// ----------------- Grid Details --------------------------
