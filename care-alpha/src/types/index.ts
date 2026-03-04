export type TabKey = 'map' | 'messages' | 'bookings' | 'profile';

export type AvailabilityMode = 'Now' | 'Schedule';

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  interests: string[];
  rating: number;
  reviews: number;
  price: number;
  etaMin: number;
  availableNow: boolean;
  availableTimes: string[];
  lat: number;
  lng: number;
};

export type Booking = {
  id: string;
  doctorId: string;
  timeLabel: string;
  status: 'confirmed' | 'starting_soon' | 'completed';
  deposit: number;
};
