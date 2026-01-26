import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Users } from "lucide-react";

interface TicketTypeSelectorProps {
  ticketType: 'STAY' | 'SEAT_ONLY' | null;
  onTicketTypeChange: (type: 'STAY' | 'SEAT_ONLY') => void;
  availableStayTickets: boolean;
  availableSeatTickets: boolean;
}

export const TicketTypeSelector = ({
  ticketType,
  onTicketTypeChange,
  availableStayTickets,
  availableSeatTickets
}: TicketTypeSelectorProps) => {
  if (!availableStayTickets && !availableSeatTickets) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      <Label className="text-lg font-semibold">Select Ticket Type *</Label>
      <RadioGroup
        value={ticketType || ''}
        onValueChange={(value) => onTicketTypeChange(value as 'STAY' | 'SEAT_ONLY')}
        className="space-y-3"
      >
        {availableStayTickets && (
          <Card className={`cursor-pointer transition-all ${
            ticketType === 'STAY' ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'
          }`}>
            <label htmlFor="ticket-stay" className="cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="STAY" id="ticket-stay" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Home className="w-5 h-5 text-primary" />
                      <span className="font-semibold">STAY Ticket</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Includes accommodation with room and bed assignment
                    </p>
                  </div>
                </div>
              </CardContent>
            </label>
          </Card>
        )}

        {availableSeatTickets && (
          <Card className={`cursor-pointer transition-all ${
            ticketType === 'SEAT_ONLY' ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'
          }`}>
            <label htmlFor="ticket-seat" className="cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="SEAT_ONLY" id="ticket-seat" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-5 h-5 text-primary" />
                      <span className="font-semibold">SEAT-ONLY Ticket</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Workshop participation only, no accommodation included
                    </p>
                  </div>
                </div>
              </CardContent>
            </label>
          </Card>
        )}
      </RadioGroup>
    </div>
  );
};
