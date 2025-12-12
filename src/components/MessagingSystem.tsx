import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { 
  Send, 
  MessageSquare, 
  Clock, 
  User,
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'instructor' | 'location_owner';
  content: string;
  created_at: string;
  read: boolean;
}

interface EventRequest {
  id: string;
  event_title: string;
  instructor_name: string;
  property_name: string;
  start_date: string;
  end_date: string;
  expected_headcount: number;
  status: 'pending' | 'approved' | 'declined';
  basic_schedule: {
    check_in: string;
    check_out: string;
    sewing_hours: string;
    meals: string[];
  };
}

interface MessagingSystemProps {
  eventRequest: EventRequest;
  onClose?: () => void;
}

const MessagingSystem = ({ eventRequest, onClose }: MessagingSystemProps) => {
  const { user, role } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
    // Set up real-time subscription
    const subscription = supabase
      .channel(`messages:${eventRequest.id}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `event_request_id=eq.${eventRequest.id}`
        }, 
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [eventRequest.id]);

  const fetchMessages = async () => {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('event_request_id', eventRequest.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(messages || []);
      
      // Mark messages as read
      if (messages && messages.length > 0) {
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('event_request_id', eventRequest.id)
          .neq('sender_id', user?.id);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setSending(true);
    try {
      const messageData = {
        event_request_id: eventRequest.id,
        sender_id: user.id,
        sender_name: user.user_metadata?.first_name && user.user_metadata?.last_name 
          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
          : user.email?.split('@')[0] || 'Unknown',
        sender_role: role as 'instructor' | 'location_owner',
        content: newMessage.trim(),
        read: false
      };

      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) throw error;

      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
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

  const isMessageFromOtherParty = (message: Message) => {
    return message.sender_id !== user?.id;
  };

  if (loading) {
    return (
      <Card className="h-[600px]">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Logistics Discussion
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {eventRequest.event_title}
            </p>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
        
        {/* Event Details Summary */}
        <div className="bg-muted/50 p-3 rounded-lg space-y-2">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{eventRequest.property_name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{eventRequest.start_date} - {eventRequest.end_date}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{eventRequest.expected_headcount} people</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span>Check-in: {eventRequest.basic_schedule.check_in}</span>
            <span>Check-out: {eventRequest.basic_schedule.check_out}</span>
            <span>Sewing: {eventRequest.basic_schedule.sewing_hours}</span>
          </div>
          {eventRequest.basic_schedule.meals.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {eventRequest.basic_schedule.meals.map((meal, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {meal}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No messages yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start the conversation about logistics and setup requirements.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isMessageFromOtherParty(message) ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {getInitials(message.sender_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[70%] ${isMessageFromOtherParty(message) ? 'items-start' : 'items-end'} flex flex-col`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{message.sender_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {message.sender_role === 'instructor' ? 'Instructor' : 'Property Owner'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <div className={`rounded-lg p-3 ${
                      isMessageFromOtherParty(message) 
                        ? 'bg-muted' 
                        : 'bg-primary text-primary-foreground'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ask about arrival times, setup needs, extra tables, supplies, etc..."
              className="flex-1 min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!newMessage.trim() || sending}
              className="self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MessagingSystem;
