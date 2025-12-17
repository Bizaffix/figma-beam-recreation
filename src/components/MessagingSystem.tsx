import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { format, isToday, isYesterday } from "date-fns";
import { 
  Send, 
  MessageSquare, 
  Clock, 
  User,
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowLeft
} from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'instructor' | 'location_owner' | 'student';
  receiver_id?: string;
  receiver_name?: string;
  content: string;
  created_at: string;
  read: boolean;
  message_type: 'event_request' | 'retreat_question' | 'attendee_communication' | 'venue_communication';
  related_id?: string; // retreat_id, event_request_id, or booking_id
}

interface EventRequest {
  id: string;
  event_title: string;
  instructor_name: string;
  instructor_id: string;
  property_name: string;
  property_id: string;
  property_owner_id: string;
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
  created_at: string;
}

interface Retreat {
  id: number;
  title: string;
  instructor_id: string;
  instructor_name: string;
  location: string;
  date: string;
  level: string;
}

interface Booking {
  id: string;
  retreat_id: number;
  student_id: string;
  student_name: string;
  student_email: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}

type MessagingContext = 'event_request' | 'retreat_detail' | 'organizer_dashboard' | 'inbox';

interface MessagingSystemProps {
  context?: MessagingContext;
  eventRequest?: EventRequest;
  retreat?: Retreat;
  booking?: Booking;
  recipientId?: string;
  recipientName?: string;
  recipientRole?: 'instructor' | 'location_owner' | 'student';
  onClose?: () => void;
  onBack?: () => void;
}

const MessagingSystem = ({ 
  context = 'event_request', 
  eventRequest, 
  retreat, 
  booking, 
  recipientId, 
  recipientName, 
  recipientRole,
  onClose, 
  onBack 
}: MessagingSystemProps) => {
  const { user, role } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [availableRecipients, setAvailableRecipients] = useState<Array<{
    id: string;
    name: string;
    role: 'instructor' | 'location_owner' | 'student';
  }>>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [selectedRecipientName, setSelectedRecipientName] = useState('');

  // Determine message context and fetch related data
  const getMessageContext = () => {
    switch (context) {
      case 'event_request':
        return {
          messageType: 'event_request' as const,
          relatedId: eventRequest?.id,
          title: eventRequest?.event_title || 'Event Discussion',
          subtitle: `${eventRequest?.instructor_name} ↔ ${eventRequest?.property_name}`
        };
      case 'retreat_detail':
        return {
          messageType: 'retreat_question' as const,
          relatedId: retreat?.id?.toString(),
          title: retreat?.title || 'Retreat Questions',
          subtitle: `Questions about ${retreat?.title}`
        };
      case 'organizer_dashboard':
        return {
          messageType: 'attendee_communication' as const,
          relatedId: booking?.id,
          title: `Communication with ${booking?.student_name}`,
          subtitle: `Regarding booking for retreat`
        };
      default:
        return {
          messageType: 'retreat_question' as const,
          relatedId: retreat?.id?.toString(),
          title: 'Messages',
          subtitle: 'General conversation'
        };
    }
  };

  const messageContext = getMessageContext();

  useEffect(() => {
    if (!messageContext.relatedId) return;
    
    fetchMessages();
    fetchAvailableRecipients();
  }, [messageContext.relatedId, context]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user || !messageContext.relatedId) return;

    const channel = supabase
      .channel(`messages-${messageContext.relatedId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `related_id=eq.${messageContext.relatedId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          
          // Only add message if it's relevant to this conversation
          if (newMessage.sender_id === user?.id || 
              newMessage.receiver_id === user?.id) {
            setMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageContext.relatedId]);

  const fetchMessages = async () => {
    if (!messageContext.relatedId) return;
    
    try {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('related_id', messageContext.relatedId)
        .order('created_at', { ascending: true });

      // For retreat questions, only show messages between the two participants
      if (context === 'retreat_detail' && retreat) {
        // Get the current user's conversation partner
        let partnerId: string | undefined;
        
        if (role === 'student') {
          partnerId = retreat.instructor_id;
        } else if (role === 'instructor') {
          // For instructor, find the student they're conversing with
          const { data: lastStudentMessage } = await supabase
            .from('messages')
            .select('sender_id')
            .eq('related_id', messageContext.relatedId)
            .eq('message_type', 'retreat_question')
            .eq('sender_role', 'student')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          partnerId = lastStudentMessage?.sender_id;
        }

        if (partnerId) {
          query = query.or(`and(sender_id.eq.${user?.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user?.id})`);
        }
      }

      // For specific conversation contexts, filter by participants
      if (context === 'organizer_dashboard' && booking) {
        query = query.or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`);
      }

      const { data: messages, error } = await query;

      if (error) throw error;
      setMessages(messages || []);
      
      // Mark messages as read
      if (messages && messages.length > 0) {
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('related_id', messageContext.relatedId)
          .neq('sender_id', user?.id);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRecipients = async () => {
    try {
      let recipients: Array<{ id: string; name: string; role: 'instructor' | 'location_owner' | 'student' }> = [];

      switch (context) {
        case 'retreat_detail':
          if (retreat && role === 'student') {
            // Student can message the retreat instructor
            recipients.push({
              id: retreat.instructor_id,
              name: retreat.instructor_name,
              role: 'instructor'
            });
          } else if (retreat && role === 'instructor') {
            // Instructor can message students who booked this retreat
            const { data: bookings } = await supabase
              .from('bookings')
              .select('student_id, student_name')
              .eq('retreat_id', retreat.id)
              .eq('status', 'confirmed');
            
            if (bookings) {
              recipients = bookings.map(booking => ({
                id: booking.student_id,
                name: booking.student_name,
                role: 'student'
              }));
            }
          }
          break;
        
        case 'organizer_dashboard':
          if (booking) {
            // Organizer can message the specific student
            recipients.push({
              id: booking.student_id,
              name: booking.student_name,
              role: 'student'
            });
          }
          break;
      }

      setAvailableRecipients(recipients);
    } catch (error) {
      console.error('Error fetching recipients:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !messageContext.relatedId) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setSending(true);

    // Determine receiver based on context
    let receiverId: string | undefined;
    let receiverName: string | undefined;

    if (context === 'event_request') {
      // For event requests, determine the other party
      if (role === 'instructor') {
        receiverId = eventRequest?.property_owner_id;
        receiverName = 'Property Owner';
      } else if (role === 'location_owner') {
        receiverId = eventRequest?.instructor_id;
        receiverName = eventRequest?.instructor_name;
      } else if (role === 'student') {
        // Students shouldn't be in event request context, but handle anyway
        receiverId = eventRequest?.instructor_id;
        receiverName = eventRequest?.instructor_name;
      }
    } else if (context === 'retreat_detail' && retreat) {
      // For retreat questions, always set the instructor as receiver
      if (role === 'student') {
        receiverId = retreat.instructor_id;
        receiverName = retreat.instructor_name;
      } else if (role === 'instructor') {
        // For instructor replying, try to determine the student from existing messages
        const studentMessage = messages.find(m => m.sender_role === 'student');
        if (studentMessage) {
          receiverId = studentMessage.sender_id;
          receiverName = studentMessage.sender_name;
        }
      }
    } else if (selectedRecipientId) {
      // Direct messaging
      receiverId = selectedRecipientId;
      receiverName = selectedRecipientName;
    }

    // Create optimistic message for instant display
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`, // Temporary ID
      related_id: messageContext.relatedId,
      message_type: messageContext.messageType,
      sender_id: user.id,
      sender_name: user.user_metadata?.first_name && user.user_metadata?.last_name 
        ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
        : user.email?.split('@')[0] || 'Unknown',
      sender_role: role as 'instructor' | 'location_owner' | 'student',
      receiver_id: receiverId || null,
      receiver_name: receiverName || null,
      content: messageText,
      created_at: new Date().toISOString(),
      read: false
    };

    // Add message to local state instantly
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const messageData = {
        related_id: messageContext.relatedId,
        message_type: messageContext.messageType,
        sender_id: user.id,
        sender_name: optimisticMessage.sender_name,
        sender_role: role as 'instructor' | 'location_owner' | 'student',
        receiver_id: receiverId || null,
        receiver_name: receiverName || null,
        content: messageText,
        read: false
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic message with real message
      if (data) {
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticMessage.id ? data : msg
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
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

  const formatDateForSeparator = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  };

  const formatMessageTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: Record<string, Message[]> = {};
    
    messages.forEach(message => {
      const messageDate = new Date(message.created_at);
      const dateKey = formatDateForSeparator(messageDate);
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
    
    return groups;
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
      {/* Fixed Chat Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 flex-shrink-0">
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <Avatar className="w-10 h-10">
          <AvatarFallback className="bg-primary/10 text-sm">
            {context === 'retreat_detail' && retreat 
              ? getInitials(retreat.instructor_name)
              : context === 'event_request' && eventRequest
              ? getInitials(role === 'instructor' ? 'Property Owner' : eventRequest.instructor_name)
              : '?'
            }
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold">
            {context === 'retreat_detail' && retreat 
              ? retreat.instructor_name
              : context === 'event_request' && eventRequest
              ? (role === 'instructor' ? 'Property Owner' : eventRequest.instructor_name)
              : 'Chat'
            }
          </h3>
          <p className="text-sm text-muted-foreground">
            {context === 'retreat_detail' && retreat 
              ? `About ${retreat.title}`
              : context === 'event_request' && eventRequest
              ? `Event: ${eventRequest.event_title}`
              : 'Conversation'
            }
          </p>
        </div>
      </div>

      {/* Scrollable Message Area */}
      <ScrollArea className="flex-1 p-4 bg-gray-50">
        <div className="space-y-1">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                {context === 'retreat_detail' 
                  ? 'Ask about the retreat, schedule, accommodations, or any questions you have.'
                  : context === 'organizer_dashboard'
                  ? 'Send important updates or answer questions about the retreat.'
                  : 'Start the conversation about logistics and setup requirements.'
                }
              </p>
            </div>
          ) : (
            Object.entries(groupMessagesByDate(messages)).map(([dateKey, dateMessages]) => (
              <div key={dateKey} className="space-y-3">
                {/* Date Separator */}
                <div className="flex items-center justify-center my-4">
                  <span className="bg-white px-3 py-1 text-xs text-muted-foreground rounded-full border">
                    {dateKey}
                  </span>
                </div>
                
                {/* Messages for this date */}
                {dateMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'} mb-2`}
                  >
                    <div className={`max-w-[70%] ${message.sender_id === user?.id ? 'order-2' : 'order-1'}`}>
                      <div className={`rounded-2xl px-4 py-2 ${
                        message.sender_id === user?.id 
                          ? 'bg-primary text-primary-foreground rounded-br-sm' 
                          : 'bg-white text-foreground rounded-bl-sm border'
                      }`}>
                        <p className="text-sm leading-relaxed break-words">
                          {message.content}
                        </p>
                      </div>
                      <div className={`text-xs text-muted-foreground mt-1 ${
                        message.sender_id === user?.id ? 'text-right' : 'text-left'
                      }`}>
                        {formatMessageTime(new Date(message.created_at))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Fixed Message Input Footer */}
      <div className="border-t bg-white p-4 flex-shrink-0">
        {availableRecipients.length > 1 && (
          <div className="mb-3">
            <Select value={selectedRecipientId || ''} onValueChange={(value) => {
              const recipient = availableRecipients.find(r => r.id === value);
              setSelectedRecipientId(recipient?.id || '');
              setSelectedRecipientName(recipient?.name || '');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select recipient..." />
              </SelectTrigger>
              <SelectContent>
                {availableRecipients.map((recipient) => (
                  <SelectItem key={recipient.id} value={recipient.id}>
                    {recipient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 min-h-[44px] max-h-32 resize-none border-gray-200 focus:border-primary"
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
            className="px-4 py-2 h-[44px] bg-primary hover:bg-primary/90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default MessagingSystem;
