import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, Users, Home, AlertCircle } from "lucide-react";
import { fetchEventRooms, holdBed, getAttendeeProfileForBed, expireHeldInventory, type EventRoom, type EventBed } from "@/lib/event-capacity";
import { supabase } from "@/lib/supabase";

interface BedSelectionProps {
  eventId: number;
  onBedSelected: (bedId: string, roomId: string, bedTitle: string, roomName: string) => void;
  selectedBedId?: string;
}

export const BedSelection = ({ eventId, onBedSelected, selectedBedId }: BedSelectionProps) => {
  const [rooms, setRooms] = useState<EventRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [selectedBed, setSelectedBed] = useState<{ bedId: string; roomId: string; bedTitle: string; roomName: string } | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<any>(null);
  const [holdingBed, setHoldingBed] = useState<string | null>(null);

  useEffect(() => {
    loadRooms();
    // Expire held inventory on load
    expireHeldInventory();
  }, [eventId]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const eventRooms = await fetchEventRooms(eventId);
      setRooms(eventRooms);
      
      // Auto-expand first room
      if (eventRooms.length > 0 && !expandedRoom) {
        setExpandedRoom(eventRooms[0].id);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBedClick = async (bed: EventBed, room: EventRoom) => {
    if (bed.status === 'BOOKED') {
      // View roommate profile
      const profile = await getAttendeeProfileForBed(bed.id);
      if (profile) {
        setViewingProfile(profile);
        setProfileModalOpen(true);
      }
      return;
    }

    if (bed.status === 'AVAILABLE') {
      // Hold the bed
      setHoldingBed(bed.id);
      const result = await holdBed(bed.id);
      
      if (result.success) {
        setSelectedBed({
          bedId: bed.id,
          roomId: room.id,
          bedTitle: bed.title,
          roomName: room.name
        });
        onBedSelected(bed.id, room.id, bed.title, room.name);
        // Reload to show updated status
        loadRooms();
      }
      setHoldingBed(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading rooms...</div>;
  }

  if (rooms.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No rooms available for this event</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {rooms.map((room) => {
          const isExpanded = expandedRoom === room.id;
          const beds = room.beds || [];

          return (
            <Card key={room.id} className="overflow-hidden">
              <CardContent className="p-0">
                <button
                  onClick={() => setExpandedRoom(isExpanded ? null : room.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 text-left">
                    {room.image_url && (
                      <img
                        src={room.image_url}
                        alt={room.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{room.name}</h4>
                      {room.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {room.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          <Home className="w-3 h-3 mr-1" />
                          {room.bed_count} {room.bed_count === 1 ? 'bed' : 'beds'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedRoom(isExpanded ? null : room.id);
                    }}
                  >
                    {isExpanded ? 'Hide' : 'View'} Beds
                  </Button>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t bg-muted/30">
                    {room.bed_count === 1 && beds.length === 0 ? (
                      // Single bed room - auto-select
                      <div className="pt-4">
                        <Card className="border-primary">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                                <div>
                                  <p className="font-medium">Single Bed</p>
                                  <p className="text-sm text-muted-foreground">This room has one bed</p>
                                </div>
                              </div>
                              <Badge className="bg-primary">Selected</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <div className="pt-4 space-y-2">
                        <p className="text-sm font-medium mb-3">Select a bed:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {beds.map((bed) => {
                            const isSelected = selectedBed?.bedId === bed.id;
                            const isHolding = holdingBed === bed.id;
                            const isBooked = bed.status === 'BOOKED';
                            const isHeld = bed.status === 'HELD';

                            return (
                              <Card
                                key={bed.id}
                                className={`cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-primary ring-2 ring-primary'
                                    : isBooked
                                    ? 'border-muted opacity-75'
                                    : 'hover:border-primary/50'
                                }`}
                                onClick={() => !isBooked && handleBedClick(bed, room)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                      {bed.image_url ? (
                                        <img
                                          src={bed.image_url}
                                          alt={bed.title}
                                          className="w-full h-24 object-cover rounded-lg mb-2"
                                        />
                                      ) : (
                                        <div className="w-full h-24 bg-muted rounded-lg mb-2 flex items-center justify-center">
                                          <Home className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                      )}
                                      <div className="flex items-center gap-2 mb-1">
                                        <h5 className="font-medium">{bed.title}</h5>
                                        {isSelected && (
                                          <CheckCircle2 className="w-4 h-4 text-primary" />
                                        )}
                                      </div>
                                      {isBooked && (
                                        <p className="text-xs text-muted-foreground">
                                          Booked - Click to view roommate
                                        </p>
                                      )}
                                      {isHeld && !isSelected && (
                                        <p className="text-xs text-orange-600">
                                          Temporarily held
                                        </p>
                                      )}
                                    </div>
                                    {isBooked && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleBedClick(bed, room);
                                        }}
                                      >
                                        <Users className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Roommate Profile Modal */}
      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Roommate Profile</DialogTitle>
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
