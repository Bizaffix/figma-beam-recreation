import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MapPin, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { EventRoom } from "@/lib/event-capacity";

interface EventVenuePreviewProps {
  venueId: string;
  eventId: number;
  venueName?: string;
  venueLocation?: string;
  venuePhotos?: string[];
}

export const EventVenuePreview = ({
  venueId,
  eventId,
  venueName,
  venueLocation,
  venuePhotos
}: EventVenuePreviewProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [venueDetails, setVenueDetails] = useState<any>(null);
  const [rooms, setRooms] = useState<EventRoom[]>([]);
  const [loading, setLoading] = useState(false);

  const handleViewFullDetails = async () => {
    setShowFullDetails(true);
    setLoading(true);
    
    try {
      // Fetch venue details
      const { data: venue, error: venueError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', venueId)
        .single();

      if (venueError) throw venueError;

      setVenueDetails(venue);

      // Fetch event rooms (snapshot)
      const { data: roomsData, error: roomsError } = await supabase
        .from('event_rooms')
        .select(`
          *,
          beds:event_beds(*)
        `)
        .eq('event_id', eventId)
        .order('sort_order', { ascending: true });

      if (roomsError) throw roomsError;

      setRooms(roomsData || []);
    } catch (error) {
      console.error('Error fetching venue details:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayPhotos = venuePhotos || [];

  if (displayPhotos.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Venue Details</h3>
                {venueName && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {venueName}
                    {venueLocation && ` • ${venueLocation}`}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewFullDetails}
              >
                More Venue Details
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Image Carousel */}
            {displayPhotos.length > 0 && (
              <Carousel className="w-full">
                <CarouselContent className="-ml-2">
                  {displayPhotos.slice(0, 3).map((photo, index) => (
                    <CarouselItem key={index} className="pl-2 basis-1/3">
                      <div
                        className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                        onClick={() => {
                          setSelectedImageIndex(index);
                          setLightboxOpen(true);
                        }}
                      >
                        <img
                          src={photo}
                          alt={`Venue ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {displayPhotos.length > 3 && (
                  <>
                    <CarouselPrevious />
                    <CarouselNext />
                  </>
                )}
              </Carousel>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative">
            <img
              src={displayPhotos[selectedImageIndex]}
              alt={`Venue ${selectedImageIndex + 1}`}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            {displayPhotos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {displayPhotos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-2 h-2 rounded-full ${
                      index === selectedImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Venue Details Dialog */}
      <Dialog open={showFullDetails} onOpenChange={setShowFullDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">Loading venue details...</div>
          ) : venueDetails ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{venueDetails.property_name}</h2>
                <p className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {venueDetails.location}
                </p>
              </div>

              {venueDetails.photos && venueDetails.photos.length > 0 && (
                <Carousel className="w-full">
                  <CarouselContent>
                    {venueDetails.photos.map((photo: string, index: number) => (
                      <CarouselItem key={index}>
                        <img
                          src={photo}
                          alt={`Venue ${index + 1}`}
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              )}

              {venueDetails.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{venueDetails.description}</p>
                </div>
              )}

              {/* Room Details */}
              {rooms.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-4">Rooms & Beds</h3>
                  <div className="space-y-4">
                    {rooms.map((room) => (
                      <Card key={room.id}>
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            {room.image_url && (
                              <img
                                src={room.image_url}
                                alt={room.name}
                                className="w-32 h-32 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-semibold mb-1">{room.name}</h4>
                              {room.description && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {room.description}
                                </p>
                              )}
                              <p className="text-sm">
                                <span className="font-medium">Beds:</span> {room.bed_count}
                              </p>
                              {room.beds && room.beds.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {room.beds.map((bed) => (
                                    <div key={bed.id} className="text-sm text-muted-foreground">
                                      • {bed.title}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};
