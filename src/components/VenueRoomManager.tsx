import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Upload, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { validateVenueRooms, type VenueRoom, type VenueBed, type VenueValidationResult } from "@/lib/venue-validation";

interface VenueRoomManagerProps {
  venueId: string;
  onValidationChange?: (isValid: boolean, validation: VenueValidationResult) => void;
}

export const VenueRoomManager = ({ venueId, onValidationChange }: VenueRoomManagerProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<VenueRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRoom, setEditingRoom] = useState<VenueRoom | null>(null);
  const [editingBed, setEditingBed] = useState<{ bed: VenueBed; roomId: string } | null>(null);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [bedDialogOpen, setBedDialogOpen] = useState(false);

  useEffect(() => {
    if (venueId) {
      fetchRooms();
    }
  }, [venueId]);

  useEffect(() => {
    // Validate and notify parent
    const validation = validateVenueRooms(rooms);
    onValidationChange?.(validation.isValid, validation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const { data: roomsData, error: roomsError } = await supabase
        .from('venue_rooms')
        .select('*')
        .eq('venue_id', venueId)
        .order('sort_order', { ascending: true });

      if (roomsError) throw roomsError;

      // Fetch beds for each room
      if (roomsData && roomsData.length > 0) {
        const roomIds = roomsData.map(r => r.id);
        const { data: bedsData, error: bedsError } = await supabase
          .from('venue_beds')
          .select('*')
          .in('room_id', roomIds)
          .order('sort_order', { ascending: true });

        if (bedsError) throw bedsError;

        // Group beds by room
        const roomsWithBeds: VenueRoom[] = roomsData.map(room => ({
          id: room.id,
          name: room.name,
          image_url: room.image_url || undefined,
          description: room.description || '',
          bed_count: room.bed_count,
          beds: (bedsData || []).filter(bed => bed.room_id === room.id)
        }));

        setRooms(roomsWithBeds);
      } else {
        setRooms([]);
      }
    } catch (error: any) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load rooms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoom = async (room: VenueRoom) => {
    try {
      setSaving(true);
      const roomData = {
        venue_id: venueId,
        name: room.name,
        image_url: room.image_url || null,
        description: room.description,
        bed_count: room.bed_count,
        sort_order: rooms.length
      };

      if (room.id) {
        // Update existing room
        const { error } = await supabase
          .from('venue_rooms')
          .update(roomData)
          .eq('id', room.id);

        if (error) throw error;

        // Handle beds: delete old beds if bed_count changed
        if (room.bed_count === 1) {
          // Delete all beds for single-bed room
          await supabase
            .from('venue_beds')
            .delete()
            .eq('room_id', room.id);
        } else if (room.beds) {
          // Update beds
          const existingBedIds = room.beds.filter(b => b.id).map(b => b.id!);
          
          // Delete beds that are no longer needed
          const { data: currentBeds } = await supabase
            .from('venue_beds')
            .select('id')
            .eq('room_id', room.id);
          
          const bedsToDelete = (currentBeds || [])
            .map(b => b.id)
            .filter(id => !existingBedIds.includes(id));
          
          if (bedsToDelete.length > 0) {
            await supabase
              .from('venue_beds')
              .delete()
              .in('id', bedsToDelete);
          }

          // Upsert beds
          for (const bed of room.beds) {
            const bedData = {
              room_id: room.id,
              title: bed.title,
              image_url: bed.image_url || null,
              sort_order: bed.sort_order || 0
            };

            if (bed.id) {
              await supabase
                .from('venue_beds')
                .update(bedData)
                .eq('id', bed.id);
            } else {
              await supabase
                .from('venue_beds')
                .insert(bedData);
            }
          }
        }
      } else {
        // Create new room
        const { data: newRoom, error } = await supabase
          .from('venue_rooms')
          .insert(roomData)
          .select()
          .single();

        if (error) throw error;

        // Create beds if bed_count > 1
        if (newRoom && room.bed_count > 1 && room.beds) {
          const bedsToInsert = room.beds.map((bed, index) => ({
            room_id: newRoom.id,
            title: bed.title,
            image_url: bed.image_url || null,
            sort_order: index
          }));

          await supabase
            .from('venue_beds')
            .insert(bedsToInsert);
        }
      }

      toast({
        title: "Success",
        description: "Room saved successfully",
      });

      setRoomDialogOpen(false);
      setEditingRoom(null);
      fetchRooms();
    } catch (error: any) {
      console.error('Error saving room:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save room",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room? This will also delete all beds in the room.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('venue_rooms')
        .delete()
        .eq('id', roomId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Room deleted successfully",
      });

      fetchRooms();
    } catch (error: any) {
      console.error('Error deleting room:', error);
      toast({
        title: "Error",
        description: "Failed to delete room",
        variant: "destructive",
      });
    }
  };

  const validation = validateVenueRooms(rooms);

  if (loading) {
    return <div className="text-center py-8">Loading rooms...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Validation Status */}
      {!validation.isValid && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-orange-900 mb-1">Venue Details Required</h4>
                <p className="text-sm text-orange-800">
                  Complete all required fields to enable bed selection for events. Missing: {validation.missingFields.length} field(s)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rooms List */}
      <div className="space-y-4">
        {rooms.map((room) => {
          const roomValidation = validation.rooms.find(r => r.roomId === room.id);
          const isValid = roomValidation?.isValid ?? false;

          return (
            <Card key={room.id} className={isValid ? '' : 'border-red-200 bg-red-50'}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{room.name}</CardTitle>
                      {isValid ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    {!isValid && roomValidation && (
                      <div className="text-sm text-red-700">
                        Missing: {roomValidation.missingFields.join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingRoom(room);
                        setRoomDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => room.id && handleDeleteRoom(room.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {room.image_url && (
                    <img
                      src={room.image_url}
                      alt={room.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  <p className="text-sm text-muted-foreground">{room.description}</p>
                  
                  {room.bed_count > 1 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Beds ({room.bed_count})</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingRoom(room);
                            setRoomDialogOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Manage Beds
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {room.beds?.map((bed) => {
                          const bedValidation = roomValidation?.beds.find(b => b.bedId === bed.id);
                          const bedIsValid = bedValidation?.isValid ?? false;

                          return (
                            <Card
                              key={bed.id}
                              className={bedIsValid ? '' : 'border-red-200 bg-red-50'}
                            >
                              <CardContent className="p-3">
                                {bed.image_url && (
                                  <img
                                    src={bed.image_url}
                                    alt={bed.title}
                                    className="w-full h-24 object-cover rounded mb-2"
                                  />
                                )}
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">{bed.title}</span>
                                  {!bedIsValid && (
                                    <AlertCircle className="w-4 h-4 text-red-600" />
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Room Button */}
      <Button
        onClick={() => {
          setEditingRoom({
            name: '',
            description: '',
            bed_count: 1,
            beds: []
          });
          setRoomDialogOpen(true);
        }}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Room
      </Button>

      {/* Room Dialog */}
      <RoomDialog
        open={roomDialogOpen}
        onOpenChange={setRoomDialogOpen}
        room={editingRoom}
        onSave={handleSaveRoom}
        saving={saving}
      />
    </div>
  );
};

interface RoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: VenueRoom | null;
  onSave: (room: VenueRoom) => void;
  saving: boolean;
}

const RoomDialog = ({ open, onOpenChange, room, onSave, saving }: RoomDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<VenueRoom>({
    name: '',
    description: '',
    bed_count: 1,
    beds: []
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (room) {
      setFormData(room);
    } else {
      setFormData({
        name: '',
        description: '',
        bed_count: 1,
        beds: []
      });
    }
  }, [room]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'room' | 'bed', bedIndex?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to upload images",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      // Use venue-images bucket with user ID folder structure (required by RLS policy)
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('venue-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('venue-images')
        .getPublicUrl(filePath);

      if (type === 'room') {
        setFormData(prev => ({ ...prev, image_url: publicUrl }));
      } else if (type === 'bed' && bedIndex !== undefined) {
        setFormData(prev => ({
          ...prev,
          beds: prev.beds?.map((bed, idx) =>
            idx === bedIndex ? { ...bed, image_url: publicUrl } : bed
          ) || []
        }));
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleBedCountChange = (newCount: number) => {
    const currentBeds = formData.beds || [];
    let newBeds: VenueBed[];

    if (newCount > currentBeds.length) {
      // Add new beds
      newBeds = [...currentBeds];
      for (let i = currentBeds.length; i < newCount; i++) {
        newBeds.push({
          title: `Bed ${i + 1}`,
          image_url: undefined
        });
      }
    } else {
      // Remove beds
      newBeds = currentBeds.slice(0, newCount);
    }

    setFormData(prev => ({
      ...prev,
      bed_count: newCount,
      beds: newBeds
    }));
  };

  const handleBedFieldChange = (index: number, field: keyof VenueBed, value: string) => {
    setFormData(prev => ({
      ...prev,
      beds: prev.beds?.map((bed, idx) =>
        idx === index ? { ...bed, [field]: value } : bed
      ) || []
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{room?.id ? 'Edit Room' : 'Add Room'}</DialogTitle>
          <DialogDescription>
            Add room details. All fields are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="room-name">Room Name *</Label>
            <Input
              id="room-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="room-description">Room Description *</Label>
            <Textarea
              id="room-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
              rows={3}
            />
          </div>

          <div>
            <Label>Room Image *</Label>
            <div className="space-y-2">
              {formData.image_url && (
                <img
                  src={formData.image_url}
                  alt="Room"
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'room')}
                disabled={uploadingImage}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bed-count">Number of Beds *</Label>
            <Input
              id="bed-count"
              type="number"
              min="1"
              value={formData.bed_count}
              onChange={(e) => handleBedCountChange(parseInt(e.target.value) || 1)}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.bed_count === 1
                ? 'Single bed room - no additional bed details needed'
                : `Add details for ${formData.bed_count} beds below`}
            </p>
          </div>

          {formData.bed_count > 1 && (
            <div className="space-y-4 border-t pt-4">
              <Label>Bed Details *</Label>
              {formData.beds?.map((bed, index) => (
                <Card key={index}>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <Label>Bed {index + 1} Title *</Label>
                      <Input
                        value={bed.title}
                        onChange={(e) => handleBedFieldChange(index, 'title', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Bed {index + 1} Image *</Label>
                      {bed.image_url && (
                        <img
                          src={bed.image_url}
                          alt={bed.title}
                          className="w-full h-32 object-cover rounded-lg mb-2"
                        />
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'bed', index)}
                        disabled={uploadingImage}
                        required={!bed.image_url}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || uploadingImage}>
              {saving ? 'Saving...' : 'Save Room'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
