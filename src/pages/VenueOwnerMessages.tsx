import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { 
  Send, 
  MessageSquare, 
  ArrowLeft, 
  Search,
  Users,
  Calendar,
  MapPin,
  Clock,
  Building2
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
  related_id?: string;
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

interface Conversation {
  event_request_id: string;
  event_title: string;
  property_name: string;
  start_date: string;
  end_date: string;
  status: string;
  last_message: Message;
  unread_count: number;
  participant_id: string;
  participant_name: string;
  participant_role: string;
}

const VenueOwnerMessages = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>("all");
  const [eventRequests, setEventRequests] = useState<EventRequest[]>([]);

  useEffect(() => {
    if (role !== 'location_owner') {
      navigate('/location-owner/dashboard');
      return;
    }

    fetchConversations();
  }, [user, role, navigate]);

  // Filter conversations based on selected event and search term
  const filteredConversations = conversations.filter((conversation) => {
    const matchesEvent = selectedEventFilter === "all" || conversation.event_request_id === selectedEventFilter;
    const matchesSearch = searchTerm === "" || 
      conversation.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.event_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.last_message.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesEvent && matchesSearch;
  });

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user || role !== 'location_owner') return;

    const channel = supabase
      .channel('venue-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          
          // Update conversations list to show new message
          fetchConversations();
          
          // If currently viewing the conversation with this sender, update messages
          // Handle both event request and direct message conversations
          if (selectedConversation && 
              selectedConversation.participant_id === newMessage.sender_id) {
            
            // Check if this message belongs to the current conversation
            const isCurrentEventRequest = selectedConversation.event_request_id === newMessage.related_id;
            const isCurrentDirectMessage = !newMessage.related_id && 
              selectedConversation.event_request_id.startsWith('direct-');
            
            if (isCurrentEventRequest || isCurrentDirectMessage) {
              fetchMessages(selectedConversation.event_request_id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, role, selectedConversation]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.event_request_id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      // Get all properties for this venue owner
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id, property_name')
        .eq('owner_id', user?.id);

      if (propertiesError) throw propertiesError;

      // Get event requests for all properties
      const propertyIds = properties?.map(p => p.id) || [];
      const { data: eventRequestsData, error: requestsError } = await supabase
        .from('event_requests')
        .select('*')
        .in('property_id', propertyIds);

      if (requestsError) throw requestsError;
      
      setEventRequests(eventRequestsData || []);

      // Also get any messages sent directly to this venue owner
      const { data: directMessages, error: directMessagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('receiver_id', user?.id)
        .eq('message_type', 'event_request')
        .eq('sender_role', 'instructor')
        .order('created_at', { ascending: false });

      if (directMessagesError) throw directMessagesError;

      // For each event request, get conversations with instructors
      const conversationsData: Conversation[] = [];
      const processedEventIds = new Set<string>();

      // Process event requests from properties
      for (const eventRequest of eventRequestsData || []) {
        processedEventIds.add(eventRequest.id);
        
        // Get all messages between this venue owner and instructor for this event request
        const { data: eventMessages, error: eventMessagesError } = await supabase
          .from('messages')
          .select('id, sender_id, sender_name, sender_role, created_at, content, read, receiver_id')
          .eq('related_id', eventRequest.id)
          .eq('message_type', 'event_request')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (eventMessagesError) throw eventMessagesError;

        if (eventMessages && eventMessages.length > 0) {
          const lastMessage = eventMessages[0];
          
          // Count unread messages from instructor
          const unreadCount = eventMessages.filter(m => 
            m.sender_id !== user?.id && 
            m.receiver_id && m.receiver_id === user?.id && 
            m.read === false
          ).length;

          conversationsData.push({
            event_request_id: eventRequest.id,
            event_title: eventRequest.event_title,
            property_name: eventRequest.property_name,
            start_date: eventRequest.start_date,
            end_date: eventRequest.end_date,
            status: eventRequest.status,
            last_message: {
              id: lastMessage.id,
              sender_id: lastMessage.sender_id,
              sender_name: lastMessage.sender_name,
              sender_role: lastMessage.sender_role,
              content: lastMessage.content,
              created_at: lastMessage.created_at,
              read: lastMessage.read || false,
              message_type: 'event_request',
              related_id: eventRequest.id,
              receiver_id: lastMessage.receiver_id
            },
            unread_count: unreadCount,
            participant_id: eventRequest.instructor_id,
            participant_name: eventRequest.instructor_name,
            participant_role: 'instructor'
          });
        }
      }

      // Process direct messages that aren't associated with existing event requests
      const groupedDirectMessages = directMessages?.reduce((groups: Record<string, any[]>, message) => {
        // Group by sender (instructor) ID to avoid duplicates
        const key = `direct-${message.sender_id}`;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(message);
        return groups;
      }, {});

      for (const [key, messages] of Object.entries(groupedDirectMessages || {})) {
        if (processedEventIds.has(key)) continue; // Skip if already processed
        
        const messageGroup = messages as any[];
        const lastMessage = messageGroup[0];
        
        // Count unread messages
        const unreadCount = messageGroup.filter(m => 
          m.sender_id !== user?.id && 
          m.receiver_id === user?.id && 
          m.read === false
        ).length;

        conversationsData.push({
          event_request_id: key,
          event_title: 'Venue Inquiry',
          property_name: 'Direct Message',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          status: 'pending',
          last_message: {
            id: lastMessage.id,
            sender_id: lastMessage.sender_id,
            sender_name: lastMessage.sender_name,
            sender_role: lastMessage.sender_role,
            content: lastMessage.content,
            created_at: lastMessage.created_at,
            read: lastMessage.read || false,
            message_type: 'event_request',
            related_id: lastMessage.related_id,
            receiver_id: lastMessage.receiver_id
          },
          unread_count: unreadCount,
          participant_id: lastMessage.sender_id,
          participant_name: lastMessage.sender_name,
          participant_role: 'instructor'
        });
      }

      // Sort conversations by most recent message
      conversationsData.sort((a, b) => 
        new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime()
      );

      setConversations(conversationsData);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (eventRequestId: string) => {
    if (!selectedConversation) return;
    
    try {
      // Determine if this is a direct message or event request conversation
      const isDirectMessage = eventRequestId.startsWith('direct-');
      const actualId = isDirectMessage ? null : eventRequestId;
      
      let data;
      
      if (isDirectMessage) {
        // For direct messages, fetch by participant and message type
        const { data: directData, error: directError } = await supabase
          .from('messages')
          .select('*')
          .eq('message_type', 'event_request')
          .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${selectedConversation.participant_id}),and(sender_id.eq.${selectedConversation.participant_id},receiver_id.eq.${user?.id})`)
          .order('created_at', { ascending: true });
        
        if (directError) throw directError;
        data = directData;
      } else {
        // For event request messages, fetch by related_id
        const { data: eventData, error: eventError } = await supabase
          .from('messages')
          .select('*')
          .eq('related_id', eventRequestId)
          .eq('message_type', 'event_request')
          .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
          .order('created_at', { ascending: true });

        if (eventError) throw eventError;
        data = eventData;
      }

      setMessages(data || []);

      // Mark messages as read
      const unreadMessages = data?.filter(m => m.receiver_id === user.id && !m.read);
      if (unreadMessages && unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('receiver_id', user.id)
          .eq('message_type', 'event_request')
          .in('id', unreadMessages.map(m => m.id));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      // Determine if this is a direct message or event request conversation
      const isDirectMessage = selectedConversation.event_request_id.startsWith('direct-');
      const relatedId = isDirectMessage ? selectedConversation.event_request_id : selectedConversation.event_request_id;
      
      const messageData = {
        sender_id: user?.id,
        sender_name: user?.user_metadata?.first_name && user?.user_metadata?.last_name 
          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
          : user?.email?.split('@')[0] || 'Venue Owner',
        sender_role: 'location_owner' as const,
        receiver_id: selectedConversation.participant_id,
        content: newMessage.trim(),
        message_type: 'event_request' as const,
        related_id: relatedId,
        read: false
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, data]);
      setNewMessage("");
      
      // Update conversations list
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatDateForSeparator = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d, yyyy");
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

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    }
    return format(date, 'MMM d, h:mm a');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/location-owner/dashboard')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Messages</h1>
              <p className="text-sm text-muted-foreground">
                {conversations.reduce((acc, conv) => acc + conv.unread_count, 0) > 0 
                  ? `${conversations.reduce((acc, conv) => acc + conv.unread_count, 0)} unread` 
                  : 'All caught up!'}
              </p>
            </div>
          </div>
          {conversations.reduce((acc, conv) => acc + conv.unread_count, 0) > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {conversations.reduce((acc, conv) => acc + conv.unread_count, 0)}
            </Badge>
          )}
        </div>
        
        {/* Search Bar and Event Filter */}
        <div className="space-y-3 mt-4">
          {/* Event Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground whitespace-nowrap">Event:</label>
            <Select value={selectedEventFilter} onValueChange={setSelectedEventFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {eventRequests.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.event_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-140px)]">
        {/* Conversations List */}
        <div className={`${
          selectedConversation ? 'hidden md:flex md:w-1/3 lg:w-1/4' : 'w-full md:w-1/3 lg:w-1/4'
        } border-r border-border bg-white`}>
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-card-foreground mb-2">No conversations yet</h3>
                  <p className="text-sm text-muted-foreground">
                    When instructors send you messages about event requests, they'll appear here
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <Card
                    key={conversation.event_request_id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedConversation?.event_request_id === conversation.event_request_id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarFallback>
                            {conversation.participant_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-card-foreground truncate">
                              {conversation.participant_name}
                            </h3>
                            {conversation.unread_count > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unread_count}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {conversation.event_title}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.last_message.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Message Area */}
        <div className={`${
          selectedConversation ? 'w-full md:w-2/3 lg:w-3/4' : 'hidden md:flex md:w-2/3 lg:w-3/4'
        } bg-white`}>
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="border-b border-border p-4">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>
                      {selectedConversation.participant_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="font-semibold text-card-foreground">
                      {selectedConversation.participant_name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Event: {selectedConversation.event_title}
                    </p>
                  </div>
                  <Badge variant={selectedConversation.status === 'approved' ? 'default' : 
                                 selectedConversation.status === 'pending' ? 'secondary' : 'destructive'}>
                    {selectedConversation.status}
                  </Badge>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 h-[calc(100%-140px)]">
                <div className="p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium text-card-foreground mb-2">No messages yet</h3>
                      <p className="text-sm text-muted-foreground">
                        Start the conversation with {selectedConversation.participant_name}
                      </p>
                    </div>
                  ) : (
                    Object.entries(groupMessagesByDate(messages)).map(([dateKey, dateMessages]) => (
                      <div key={dateKey}>
                        <div className="flex items-center gap-2 my-4">
                          <div className="flex-1 h-px bg-border"></div>
                          <span className="text-xs text-muted-foreground font-medium px-2">
                            {dateKey}
                          </span>
                          <div className="flex-1 h-px bg-border"></div>
                        </div>
                        <div className="space-y-3">
                          {dateMessages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${
                                message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                              }`}
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
                                  {formatMessageTime(message.created_at)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t bg-white p-4">
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message ${selectedConversation.participant_name}...`}
                    className="flex-1 resize-none"
                    rows={1}
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
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-sm">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Select a conversation</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VenueOwnerMessages;
