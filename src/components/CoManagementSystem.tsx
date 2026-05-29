import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import {
  useLazyGetAdminUsersQuery,
  useLazyGetEventCoHostsQuery,
  useAddEventCoHostMutation,
  useUpdateEventCoHostMutation,
  useDeleteEventCoHostMutation,
} from "@/services/server";
import { mapLegacyProfile } from "@/services/mappers";
import { 
  Users, 
  Settings, 
  CheckCircle2, 
  AlertCircle,
  MessageSquare,
  Calendar,
  MapPin,
  Shield,
  Eye,
  EyeOff
} from "lucide-react";

interface CoHost {
  user_id: string;
  name: string;
  email: string;
  role: 'location_owner';
  permissions: {
    can_view_calendar: boolean;
    can_message_students: boolean;
    can_view_participant_count: boolean;
    can_manage_logistics: boolean;
  };
  added_at: string;
}

interface CoManagementSystemProps {
  eventId: string;
  eventTitle: string;
  propertyId: string;
  propertyName: string;
}

const CoManagementSystem = ({ 
  eventId, 
  eventTitle, 
  propertyId, 
  propertyName 
}: CoManagementSystemProps) => {
  const { user, role } = useAuth();
  const { canManageEvent } = usePermissions();
  const [coHosts, setCoHosts] = useState<CoHost[]>([]);
  const [availableOwners, setAvailableOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggerGetEventCoHosts] = useLazyGetEventCoHostsQuery();
  const [triggerGetAdminUsers] = useLazyGetAdminUsersQuery();
  const [addEventCoHostMutation] = useAddEventCoHostMutation();
  const [updateEventCoHostMutation] = useUpdateEventCoHostMutation();
  const [deleteEventCoHostMutation] = useDeleteEventCoHostMutation();

  useEffect(() => {
    if (eventId) {
      fetchCoHosts();
      fetchAvailableOwners();
    }
  }, [eventId]);

  const fetchCoHosts = async () => {
    try {
      const coHostsData = await triggerGetEventCoHosts(eventId).unwrap();

      const transformedCoHosts = coHostsData.map((host) => ({
        user_id: String(host.userId ?? host.user_id ?? ""),
        name: String(host.name ?? ""),
        email: String(host.email ?? ""),
        role: 'location_owner' as const,
        permissions: (host.permissions ?? {}) as CoHost['permissions'],
        added_at: String(host.addedAt ?? host.added_at ?? ""),
      }));

      setCoHosts(transformedCoHosts);
    } catch (error) {
      console.error('Error fetching co-hosts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableOwners = async () => {
    try {
      const owners = await triggerGetAdminUsers({ role: "location_owner", limit: 200 }).unwrap();
      const mapped = owners.map((o) => mapLegacyProfile(o));

      const available = mapped.filter(owner => 
        !coHosts.some(coHost => coHost.user_id === owner.id)
      );

      setAvailableOwners(available);
    } catch (error) {
      console.error('Error fetching available owners:', error);
    }
  };

  const addCoHost = async (ownerId: string) => {
    const owner = availableOwners.find(o => o.id === ownerId);
    if (!owner) return;

    setSaving(true);
    try {
      const newCoHost: Omit<CoHost, 'added_at'> = {
        user_id: owner.id,
        name: `${owner.first_name} ${owner.last_name}`,
        email: owner.email,
        role: 'location_owner',
        permissions: {
          can_view_calendar: true,
          can_message_students: false,
          can_view_participant_count: true,
          can_manage_logistics: true
        }
      };

      await addEventCoHostMutation({
        eventRequestId: eventId,
        body: {
          userId: owner.id,
          user_id: owner.id,
          name: `${owner.first_name} ${owner.last_name}`,
          email: owner.email,
          role: "location_owner",
          permissions: newCoHost.permissions,
        },
      }).unwrap();

      fetchCoHosts();
      fetchAvailableOwners();
    } catch (error) {
      console.error('Error adding co-host:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateCoHostPermissions = async (coHostId: string, permissions: CoHost['permissions']) => {
    setSaving(true);
    try {
      await updateEventCoHostMutation({
        eventRequestId: eventId,
        coHostId,
        body: { permissions },
      }).unwrap();

      fetchCoHosts();
    } catch (error) {
      console.error('Error updating co-host permissions:', error);
    } finally {
      setSaving(false);
    }
  };

  const removeCoHost = async (coHostId: string) => {
    setSaving(true);
    try {
      await deleteEventCoHostMutation({ eventRequestId: eventId, coHostId }).unwrap();

      fetchCoHosts();
      fetchAvailableOwners();
    } catch (error) {
      console.error('Error removing co-host:', error);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Only instructors can manage co-hosts
  if (role !== 'instructor' || !canManageEvent(eventId)) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-3 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Co-Management
        </CardTitle>
        <CardDescription>
          Add property owners as logistics co-hosts for this event
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Co-hosts can help manage event logistics but don't have access to payments, curriculum, or student-level data.
          </AlertDescription>
        </Alert>

        {/* Current Co-Hosts */}
        {coHosts.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Current Co-Hosts</h4>
            {coHosts.map((coHost) => (
              <div key={coHost.user_id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="text-sm">
                        {getInitials(coHost.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h5 className="font-medium">{coHost.name}</h5>
                      <p className="text-sm text-muted-foreground">{coHost.email}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        Property Owner
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeCoHost(coHost.user_id)}
                    disabled={saving}
                  >
                    Remove
                  </Button>
                </div>

                {/* Permissions */}
                <div className="space-y-3">
                  <h6 className="text-sm font-medium">Permissions</h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <Label className="text-sm">View Calendar</Label>
                      </div>
                      <Switch
                        checked={coHost.permissions.can_view_calendar}
                        onCheckedChange={(checked) =>
                          updateCoHostPermissions(coHost.user_id, {
                            ...coHost.permissions,
                            can_view_calendar: checked
                          })
                        }
                        disabled={saving}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        <Label className="text-sm">Message Students</Label>
                      </div>
                      <Switch
                        checked={coHost.permissions.can_message_students}
                        onCheckedChange={(checked) =>
                          updateCoHostPermissions(coHost.user_id, {
                            ...coHost.permissions,
                            can_message_students: checked
                          })
                        }
                        disabled={saving}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <Label className="text-sm">View Participant Count</Label>
                      </div>
                      <Switch
                        checked={coHost.permissions.can_view_participant_count}
                        onCheckedChange={(checked) =>
                          updateCoHostPermissions(coHost.user_id, {
                            ...coHost.permissions,
                            can_view_participant_count: checked
                          })
                        }
                        disabled={saving}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        <Label className="text-sm">Manage Logistics</Label>
                      </div>
                      <Switch
                        checked={coHost.permissions.can_manage_logistics}
                        onCheckedChange={(checked) =>
                          updateCoHostPermissions(coHost.user_id, {
                            ...coHost.permissions,
                            can_manage_logistics: checked
                          })
                        }
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Co-Host */}
        {availableOwners.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Add Co-Host</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableOwners.map((owner) => (
                <div
                  key={owner.id}
                  className="border rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(`${owner.first_name} ${owner.last_name}`)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h5 className="font-medium text-sm">
                        {owner.first_name} {owner.last_name}
                      </h5>
                      <p className="text-xs text-muted-foreground">{owner.email}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addCoHost(owner.id)}
                    disabled={saving}
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {availableOwners.length === 0 && coHosts.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h5 className="font-medium mb-2">No Available Property Owners</h5>
            <p className="text-sm text-muted-foreground">
              All property owners for this event are already co-hosts or no owners are available.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CoManagementSystem;
