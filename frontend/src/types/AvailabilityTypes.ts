export interface TimeRange {
    start_time: string; // ISO 8601 datetime string
    end_time: string;   // ISO 8601 datetime string
}

export interface TimeBlockEntity {
    id: number;
    start_time: string; // ISO 8601 datetime string - represents 30-minute block
}

export interface CreateAvailabilityRequest {
    userId: string; // UUID
    availableTimes: TimeRange[];
}

export interface CreateAvailabilityResponse {
    user_id: string; // UUID
    added: number;   // count of TimeBlocks created
}

export interface GetAvailabilityRequest {
    user_id: string; // UUID
}

export interface AvailabilityEntity {
    user_id: string; // UUID
    available_times: TimeBlockEntity[];
}

export interface DeleteAvailabilityRequest {
    userId: string; // UUID
    delete: TimeRange[];
}

export interface DeleteAvailabilityResponse {
    user_id: string; // UUID
    deleted: number; // count of TimeBlocks deleted
    availability: TimeBlockEntity[]; // updated availability
}
