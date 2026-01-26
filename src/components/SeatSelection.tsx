import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, Users, AlertCircle } from "lucide-react";
import { fetchEventSeats, holdSeat, getAttendeeProfileForSeat, expireHeldInventory, type EventSeat } from "@/lib/event-capacity";

interface SeatSelectionProps {
  eventId: number;
  onSeatSelected: (seatId: string, seatIndex: number, row: number, col: number) => void;
  selectedSeatId?: string;
}

export const SeatSelection = ({ eventId, onSeatSelected, selectedSeatId }: SeatSelectionProps) => {
  const [seats, setSeats] = useState<EventSeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState<EventSeat | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<any>(null);
  const [holdingSeat, setHoldingSeat] = useState<string | null>(null);

  useEffect(() => {
    loadSeats();
    // Expire held inventory on load
    expireHeldInventory();
  }, [eventId]);

  const loadSeats = async () => {
    try {
      setLoading(true);
      const eventSeats = await fetchEventSeats(eventId);
      setSeats(eventSeats);
      
      // Find selected seat
      if (selectedSeatId) {
        const seat = eventSeats.find(s => s.id === selectedSeatId);
        if (seat) {
          setSelectedSeat(seat);
        }
      }
    } catch (error) {
      console.error('Error loading seats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = async (seat: EventSeat) => {
    if (seat.status === 'BOOKED') {
      // View attendee profile
      const profile = await getAttendeeProfileForSeat(seat.id);
      if (profile) {
        setViewingProfile(profile);
        setProfileModalOpen(true);
      }
      return;
    }

    if (seat.status === 'AVAILABLE') {
      // Hold the seat
      setHoldingSeat(seat.id);
      const result = await holdSeat(seat.id);
      
      if (result.success) {
        setSelectedSeat(seat);
        onSeatSelected(seat.id, seat.seat_index, seat.row, seat.col);
        // Reload to show updated status
        loadSeats();
      }
      setHoldingSeat(null);
    }
  };

  // Group seats by row for grid display
  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) {
      acc[seat.row] = [];
    }
    acc[seat.row].push(seat);
    return acc;
  }, {} as Record<number, EventSeat[]>);

  const maxCol = Math.max(...seats.map(s => s.col), 0);

  if (loading) {
    return <div className="text-center py-8">Loading seats...</div>;
  }

  if (seats.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No seats available for this event</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Select Your Seat</h3>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-primary"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-primary"></div>
                  <span>Booked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-orange-500 bg-orange-100"></div>
                  <span>Selected</span>
                </div>
              </div>
            </div>

            {/* Seat Grid */}
            <div className="space-y-2">
              {Object.entries(seatsByRow)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([row, rowSeats]) => (
                  <div key={row} className="flex items-center gap-2">
                    <div className="w-8 text-xs text-muted-foreground text-center">
                      {row}
                    </div>
                    <div className="flex gap-1 flex-1">
                      {Array.from({ length: maxCol }, (_, colIndex) => {
                        const col = colIndex + 1;
                        const seat = rowSeats.find(s => s.col === col);
                        
                        if (!seat) {
                          return <div key={col} className="w-8 h-8" />;
                        }

                        const isSelected = selectedSeat?.id === seat.id;
                        const isBooked = seat.status === 'BOOKED';
                        const isHeld = seat.status === 'HELD' && !isSelected;

                        return (
                          <button
                            key={seat.id}
                            onClick={() => handleSeatClick(seat)}
                            disabled={isBooked && !isSelected}
                            className={`w-8 h-8 rounded-full transition-all ${
                              isSelected
                                ? 'border-2 border-orange-500 bg-orange-100 ring-2 ring-orange-300'
                                : isBooked
                                ? 'bg-primary cursor-pointer hover:ring-2 hover:ring-primary/50'
                                : isHeld
                                ? 'border-2 border-orange-300 bg-orange-50'
                                : 'border-2 border-primary cursor-pointer hover:bg-primary/10'
                            }`}
                            title={
                              isBooked
                                ? 'Booked - Click to view attendee'
                                : isSelected
                                ? 'Selected'
                                : `Seat ${seat.seat_index + 1} (Row ${row}, Col ${col})`
                            }
                          >
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 mx-auto text-orange-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>

            {selectedSeat && (
              <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="font-medium">
                    Selected: Seat {selectedSeat.seat_index + 1} (Row {selectedSeat.row}, Col {selectedSeat.col})
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendee Profile Modal */}
      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attendee Profile</DialogTitle>
          </DialogHeader>
          {viewingProfile && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={viewingProfile.avatar_url} />
                  <AvatarFallback>
                    {viewingProfile.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">
                    {viewingProfile.full_name || 'Anonymous'}
                  </h3>
                </div>
              </div>
              {viewingProfile.bio && (
                <div>
                  <h4 className="font-medium mb-2">About Me</h4>
                  <p className="text-sm text-muted-foreground">{viewingProfile.bio}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
