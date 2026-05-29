import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Upload, X, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  useLazyGetVenueRoomsQuery,
  useCreateVenueRoomMutation,
  useUpdateVenueRoomMutation,
  useDeleteVenueRoomMutation,
  useCreateVenueBedMutation,
  useUpdateVenueBedMutation,
  useDeleteVenueBedMutation,
  useUploadFileMutation,
} from "@/services/server";
import { mapVenueRoomFromApi } from "@/services/mappers";
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
  const [triggerGetVenueRooms] = useLazyGetVenueRoomsQuery();
  const [createVenueRoomMutation] = useCreateVenueRoomMutation();
  const [updateVenueRoomMutation] = useUpdateVenueRoomMutation();
  const [deleteVenueRoomMutation] = useDeleteVenueRoomMutation();
  const [createVenueBedMutation] = useCreateVenueBedMutation();
  const [updateVenueBedMutation] = useUpdateVenueBedMutation();
  const [deleteVenueBedMutation] = useDeleteVenueBedMutation();
  const [uploadFile] = useUploadFileMutation();

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
      const roomsData = await triggerGetVenueRooms(venueId).unwrap();
      const roomsWithBeds = roomsData.map((room) => mapVenueRoomFromApi(room));
      setRooms(roomsWithBeds);
    } catch (error: unknown) {
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
      const imagesArray = room.images && room.images.length > 0 
        ? room.images.filter(img => img && img.trim() !== '')
        : (room.image_url ? [room.image_url] : []);
      
      const roomBody = {
        name: room.name,
        imageUrl: imagesArray.length > 0 ? JSON.stringify(imagesArray) : null,
        description: room.description,
        bedCount: room.bed_count,
        sortOrder: rooms.length,
      };

      if (room.id) {
        await updateVenueRoomMutation({ venueId, roomId: room.id, body: roomBody }).unwrap();

        if (room.bed_count === 1) {
          const existing = room.beds?.filter((b) => b.id) ?? [];
          await Promise.all(existing.map((bed) => deleteVenueBedMutation({ venueId, bedId: bed.id! }).unwrap()));
        } else if (room.beds) {
          const existingBedIds = room.beds.filter(b => b.id).map(b => b.id!);
          const currentRoom = rooms.find((r) => r.id === room.id);
          const currentBeds = currentRoom?.beds ?? [];
          const bedsToDelete = currentBeds
            .map(b => b.id)
            .filter((id): id is string => Boolean(id && !existingBedIds.includes(id)));

          await Promise.all(bedsToDelete.map((bedId) => deleteVenueBedMutation({ venueId, bedId }).unwrap()));

          for (const [index, bed] of (room.beds ?? []).entries()) {
            const bedBody = {
              title: bed.title,
              imageUrl: bed.image_url || null,
              sortOrder: bed.sort_order ?? index,
            };

            if (bed.id) {
              await updateVenueBedMutation({ venueId, bedId: bed.id, body: bedBody }).unwrap();
            } else {
              await createVenueBedMutation({ venueId, roomId: room.id, body: bedBody }).unwrap();
            }
          }
        }
      } else {
        const newRoom = await createVenueRoomMutation({ venueId, body: roomBody }).unwrap();

        if (newRoom && room.bed_count > 1 && room.beds) {
          await Promise.all(
            room.beds.map((bed, index) =>
              createVenueBedMutation({
                venueId,
                roomId: String(newRoom.id),
                body: {
                  title: bed.title,
                  imageUrl: bed.image_url || null,
                  sortOrder: index,
                },
              }).unwrap(),
            ),
          );
        }
      }

      toast({
        title: "Success",
        description: "Room saved successfully",
      });

      setRoomDialogOpen(false);
      setEditingRoom(null);
      fetchRooms();
    } catch (error: unknown) {
      console.error('Error saving room:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save room",
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
      await deleteVenueRoomMutation({ venueId, roomId }).unwrap();

      toast({
        title: "Success",
        description: "Room deleted successfully",
      });

      fetchRooms();
    } catch (error: unknown) {
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
                  {(room.images && room.images.length > 0) || room.image_url ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {(room.images && room.images.length > 0 ? room.images : [room.image_url]).map((imageUrl, index) => (
                        imageUrl && (
                          <img
                            key={index}
                            src={imageUrl}
                            alt={`${room.name} ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                        )
                      ))}
                    </div>
                  ) : null}
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
  const [uploadFile] = useUploadFileMutation();
  const [formData, setFormData] = useState<VenueRoom>({
    name: '',
    description: '',
    bed_count: 1,
    beds: [],
    images: []
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null);

  useEffect(() => {
    if (room) {
      // Ensure images array is set
      const images = room.images && room.images.length > 0 
        ? room.images 
        : (room.image_url ? [room.image_url] : []);
      setFormData({
        ...room,
        images: images
      });
    } else {
      setFormData({
        name: '',
        description: '',
        bed_count: 1,
        beds: [],
        images: []
      });
    }
  }, [room]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'room' | 'bed', bedIndex?: number) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to upload images",
        variant: "destructive",
      });
      return;
    }

    if (type === 'room') {
      // Handle multiple room images
      setUploadingImage(true);
      try {
        const uploadPromises = Array.from(files).map((file) =>
          uploadFile({ bucket: "venue-images", file }).unwrap(),
        );
        const uploadedUrls = await Promise.all(uploadPromises);
        
        setFormData(prev => ({
          ...prev,
          images: [...(prev.images || []), ...uploadedUrls],
          image_url: uploadedUrls[0] || prev.image_url // Keep first as primary
        }));

        toast({
          title: "Success",
          description: `Uploaded ${uploadedUrls.length} image(s)`,
        });
      } catch (error: any) {
        console.error('Error uploading images:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to upload images",
          variant: "destructive",
        });
      } finally {
        setUploadingImage(false);
        e.target.value = '';
      }
    } else if (type === 'bed' && bedIndex !== undefined) {
      // Handle single bed image
      const file = files[0];
      setUploadingImageIndex(bedIndex);
      try {
        const publicUrl = await uploadFile({ bucket: "venue-images", file }).unwrap();

        setFormData(prev => ({
          ...prev,
          beds: prev.beds?.map((bed, idx) =>
            idx === bedIndex ? { ...bed, image_url: publicUrl } : bed
          ) || []
        }));
      } catch (error: any) {
        console.error('Error uploading image:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to upload image",
          variant: "destructive",
        });
      } finally {
        setUploadingImageIndex(null);
        e.target.value = '';
      }
    }
  };

  const handleRemoveRoomImage = (index: number) => {
    setFormData(prev => {
      const newImages = [...(prev.images || [])];
      newImages.splice(index, 1);
      return {
        ...prev,
        images: newImages,
        image_url: newImages[0] || undefined
      };
    });
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
            <Label>Room Images * (Add multiple images)</Label>
            <div className="space-y-2">
              {formData.images && formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {formData.images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Room ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveRoomImage(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      {index === 0 && (
                        <Badge className="absolute top-2 left-2">Primary</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageUpload(e, 'room')}
                disabled={uploadingImage}
              />
              {uploadingImage && (
                <p className="text-sm text-muted-foreground">Uploading images...</p>
              )}
              <p className="text-xs text-muted-foreground">
                You can upload multiple images. The first image will be used as the primary display image.
              </p>
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
