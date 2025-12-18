import { Home, Compass, User, LayoutDashboard, Search, Plus, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Fetch unread messages count for instructors and students
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      if (!user) return;

      try {
        let totalUnread = 0;

        if (role === 'instructor') {
          // Get all retreats for this instructor
          const { data: retreats, error: retreatsError } = await supabase
            .from('retreats')
            .select('id')
            .eq('instructor_id', user.id);

          if (retreatsError) throw retreatsError;

          // Count unread messages for all retreats
          for (const retreat of retreats || []) {
            const { count, error: countError } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('related_id', retreat.id.toString())
              .eq('message_type', 'retreat_question')
              .eq('sender_role', 'student')
              .eq('read', false);

            if (countError) throw countError;
            totalUnread += count || 0;
          }
        } else if (role === 'student') {
          // Get all retreats this student has booked or saved
          const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('retreat_id')
            .eq('user_id', user.id);

          if (bookingsError) throw bookingsError;

          // Count unread messages for all booked retreats
          for (const booking of bookings || []) {
            const { count, error: countError } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('related_id', booking.retreat_id.toString())
              .eq('message_type', 'retreat_question')
              .eq('sender_role', 'instructor')
              .eq('receiver_id', user.id)
              .eq('read', false);

            if (countError) throw countError;
            totalUnread += count || 0;
          }
        } else if (role === 'location_owner') {
          // Get all properties for this location owner
          const { data: properties, error: propertiesError } = await supabase
            .from('properties')
            .select('id')
            .eq('owner_id', user.id);

          if (propertiesError) throw propertiesError;

          // Get event requests for these properties
          const propertyIds = properties?.map(p => p.id) || [];
          const { data: eventRequests, error: requestsError } = await supabase
            .from('event_requests')
            .select('id')
            .in('property_id', propertyIds);

          if (requestsError) throw requestsError;

          // Count unread messages for all event requests
          for (const eventRequest of eventRequests || []) {
            const { count, error: countError } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('related_id', eventRequest.id)
              .eq('message_type', 'event_request')
              .eq('sender_role', 'instructor')
              .eq('receiver_id', user.id)
              .eq('read', false);

            if (countError) throw countError;
            totalUnread += count || 0;
          }
        }

        setUnreadMessages(totalUnread);
      } catch (error) {
        console.error('Error fetching unread messages:', error);
      }
    };

    fetchUnreadMessages();
  }, [user, role]);

  // Different navigation for instructors vs students vs location owners
  const navItems = role === 'instructor' 
    ? [
        { icon: Search, label: "Browse", path: "/instructor/browse" },
        { icon: LayoutDashboard, label: "Dash", path: "/instructor/dashboard" },
        { icon: MessageSquare, label: "Messages", path: "/instructor/messages" },
        { icon: User, label: "Profile", path: "/profile" },
      ]
    : role === 'location_owner'
    ? [
        { icon: LayoutDashboard, label: "Dash", path: "/location-owner/dashboard" },
        { icon: MessageSquare, label: "Messages", path: "/location-owner/messages" },
        { icon: User, label: "Profile", path: "/profile" },
      ]
    : [
        { icon: Compass, label: "Browse", path: "/browse" },
        { icon: Home, label: "Home", path: "/home" },
        { icon: MessageSquare, label: "Messages", path: "/student/messages" },
        { icon: User, label: "Profile", path: "/profile" },
      ];

  const isNewEventActive = location.pathname === "/instructor/retreats/new" || location.pathname.startsWith("/instructor/retreats/") && location.pathname.includes("/edit");

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {/* Plus button for instructors - centered and prominent */}
        {role === 'instructor' && (
          <button
            onClick={() => navigate("/instructor/retreats/new")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors relative",
              isNewEventActive ? "text-accent" : "text-muted-foreground"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all",
              isNewEventActive 
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg" 
                : "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md hover:shadow-lg"
            )}>
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-xs">Add Event</span>
          </button>
        )}
        
        {/* Regular nav items */}
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors relative",
                isActive ? "text-accent" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs">{item.label}</span>
              {item.label === "Messages" && unreadMessages > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
