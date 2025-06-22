export interface TimeRange {
    startTime: Date;
    endTime: Date;
}

export interface TimeBlockEntity {
    id: number;
    startTime: Date;
}

export interface CreateAvailabilityRequest {
    userId: string;
    availableTimes: TimeRange[];
}

export interface CreateAvailabilityResponse {
    userId: string;
    added: number;
}

export interface GetAvailabilityRequest {
    userId: string;
}

export interface AvailabilityEntity {
    userId: string;
    availableTimes: TimeBlockEntity[];
}

export interface DeleteAvailabilityRequest {
    userId: string;
    delete: TimeRange[];
}

export interface DeleteAvailabilityResponse {
    userId: string;
    deleted: number;
    availability: TimeBlockEntity[];
} 