export type Category =
  | "LIVE_MUSIC"
  | "PERFORMING_ARTS"
  | "SPORTS"
  | "SEMINARS_AND_WORKSHOPS"
  | "TOURS_AND_EXPERIENCES"
  | "OTHER";

export const CATEGORY_LABELS: Record<Category, string> = {
  LIVE_MUSIC: "Nhạc sống",
  PERFORMING_ARTS: "Nghệ thuật biểu diễn",
  SPORTS: "Thể thao",
  SEMINARS_AND_WORKSHOPS: "Hội thảo & Workshop",
  TOURS_AND_EXPERIENCES: "Tour & Trải nghiệm",
  OTHER: "Khác",
};


export type Zone = {
    id: number;
    name: string;
    price: number;
    totalRows: number;
    totalCols: number;
    colorHex: string;
    availableSeats: number;
    totalSeats: number;
}

export type SeatStatus = "AVAILABLE" | "LOCKED" | "SOLD";

export type Seat = {
  id: number;
  zoneId: number;
  zoneName: string;
  colorHex: string;
  price: number;
  rowNumber: number;
  colNumber: number;
  label: string;
  status: SeatStatus;
}

export type Event = {
    id: number;
    title: string;
    description: string;
    venue: string;
    longitude: number | null;
    latitude: number | null;
    startTime: string;
    endTime: string;
    posterUrl: string;
    status: "DRAFT" | "ON_SALE" | "ENDED";
    type: Category;
    zones: Zone[];
    createAt: string;
    spotlight: boolean;
    queueRequired: boolean;
    activeUsers: number;
};

