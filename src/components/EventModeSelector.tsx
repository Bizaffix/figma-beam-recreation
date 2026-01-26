import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Monitor, MapPin } from "lucide-react";

interface EventModeSelectorProps {
  mode: 'IN_PERSON' | 'ONLINE' | null;
  onModeChange: (mode: 'IN_PERSON' | 'ONLINE') => void;
  videoProvider?: string;
  onVideoProviderChange: (provider: string) => void;
  meetingUrl?: string;
  onMeetingUrlChange: (url: string) => void;
  venueUsageType?: 'AT_LOCATION' | 'OFFSITE' | null;
  onVenueUsageTypeChange: (type: 'AT_LOCATION' | 'OFFSITE') => void;
}

export const EventModeSelector = ({
  mode,
  onModeChange,
  videoProvider,
  onVideoProviderChange,
  meetingUrl,
  onMeetingUrlChange,
  venueUsageType,
  onVenueUsageTypeChange
}: EventModeSelectorProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold mb-3 block">Event Mode *</Label>
        <RadioGroup
          value={mode || ''}
          onValueChange={(value) => onModeChange(value as 'IN_PERSON' | 'ONLINE')}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
            <RadioGroupItem value="IN_PERSON" id="mode-in-person" />
            <Label htmlFor="mode-in-person" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-medium">In-Person Event</div>
                  <div className="text-sm text-muted-foreground">
                    Event takes place at a physical location
                  </div>
                </div>
              </div>
            </Label>
          </div>
          
          <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
            <RadioGroupItem value="ONLINE" id="mode-online" />
            <Label htmlFor="mode-online" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-medium">Online Event</div>
                  <div className="text-sm text-muted-foreground">
                    Virtual event via video conference
                  </div>
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Online Event Fields */}
      {mode === 'ONLINE' && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <div>
            <Label htmlFor="video-provider">Video Provider *</Label>
            <Select
              value={videoProvider || ''}
              onValueChange={onVideoProviderChange}
            >
              <SelectTrigger id="video-provider">
                <SelectValue placeholder="Select video provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GOOGLE_MEET">Google Meet</SelectItem>
                <SelectItem value="ZOOM">Zoom</SelectItem>
                <SelectItem value="TEAMS">Microsoft Teams</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="meeting-url">Meeting URL *</Label>
            <Input
              id="meeting-url"
              type="url"
              placeholder="https://meet.google.com/..."
              value={meetingUrl || ''}
              onChange={(e) => onMeetingUrlChange(e.target.value)}
              required
            />
          </div>
        </div>
      )}

      {/* In-Person Event Fields */}
      {mode === 'IN_PERSON' && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <div>
            <Label className="text-base font-semibold mb-3 block">Venue Usage Type *</Label>
            <RadioGroup
              value={venueUsageType || ''}
              onValueChange={(value) => onVenueUsageTypeChange(value as 'AT_LOCATION' | 'OFFSITE')}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="AT_LOCATION" id="usage-at-location" />
                <Label htmlFor="usage-at-location" className="flex-1 cursor-pointer">
                  <div>
                    <div className="font-medium">At Location</div>
                    <div className="text-sm text-muted-foreground">
                      Event takes place at the venue (enables room/bed/seat selection)
                    </div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="OFFSITE" id="usage-offsite" />
                <Label htmlFor="usage-offsite" className="flex-1 cursor-pointer">
                  <div>
                    <div className="font-medium">Offsite</div>
                    <div className="text-sm text-muted-foreground">
                      Event is organized by venue but held elsewhere
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      )}
    </div>
  );
};
