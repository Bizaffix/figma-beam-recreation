import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
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

  useEffect(() => {
    if (role !== 'location_owner') {
      navigate('/location-owner/dashboard');
      return;
    }

    fetchConversations();
  }, [user, role, navigate]);

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
          if (selectedConversation && 
              selectedConversation.participant_id === newMessage.sender_id &&
              selectedConversation.event_request_id === newMessage.related_id) {
            fetchMessages(selectedConversation.event_request_id);
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
      // Get all event requests for this venue owner's properties
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id, property_name')
        .eq('owner_id', user?.id);

      if (propertiesError) throw propertiesError;

      if (!properties || properties.length === 0) {
        setLoading(false);
        return;
      }

      // Get event requests for all properties
      const propertyIds = properties.map(p => p.id);
      const { data: eventRequests, error: requestsError } = await supabase
        .from('event_requests')
        .select('*')
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // For each event request, get messages and create conversations
      const conversationsData: Conversation[] = [];

      for (const eventRequest of eventRequests || []) {
        // Get messages for this event request
        const { data: requestMessages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('related_id', eventRequest.id)
          .eq('message_type', 'event_request')
          .order('created_at', { ascending: false })
          .limit(1); // Just need the last message for conversation list

        if (messagesError) throw messagesError;

        if (requestMessages && requestMessages.length > 0) {
          const lastMessage = requestMessages[0];
          
          // Find the other participant (not the venue owner)
          const participantId = lastMessage.sender_id === user?.id 
            ? lastMessage.receiver_id 
            : lastMessage.sender_id;
          const participantName = lastMessage.sender_id === user?.id 
            ? lastMessage.receiver_name 
            : lastMessage.sender_name;
          const participantRole = lastMessage.sender_id === user?.id 
            ? (lastMessage.receiver_id === eventRequest.instructor_id ? 'instructor' : 'student')
            : lastMessage.sender_role;

          // Count unread messages
          const { count, error: countError } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('related_id', eventRequest.id)
            .eq('message_type', 'event_request')
            .eq('sender_id', participantId)
            .eq('read', false);

          if (countError) throw countError;

          conversationsData.push({
            event_request_id: eventRequest.id,
            event_title: eventRequest.event_title,
            property_name: eventRequest.property_name,
            start_date: eventRequest.start_date,
            end_date: eventRequest.end_date,
            status: eventRequest.status,
            last_message: lastMessage,
            unread_count: count || 0,
            participant_id: participantId || '',
            participant_name: participantName || 'Unknown',
            participant_role: participantRole || 'unknown'
          });
        }
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
      // Only fetch messages between venue owner and the specific participant
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('related_id', eventRequestId)
        .eq('message_type', 'event_request')
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${selectedConversation.participant_id}),and(sender_id.eq.${selectedConversation.participant_id},receiver_id.eq.${user?.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      if (data && data.length > 0) {
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('related_id', eventRequestId)
          .eq('sender_id', selectedConversation.participant_id)
          .neq('sender_id', user?.id);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setSending(true);

    // Create optimistic message for instant display
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      related_id: selectedConversation.event_request_id,
      message_type: 'event_request',
      sender_id: user.id,
      sender_name: user.user_metadata?.first_name && user.user_metadata?.last_name 
        ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
        : user.email?.split('@')[0] || 'Venue Owner',
      sender_role: 'location_owner' as const,
      receiver_id: selectedConversation.participant_id,
      receiver_name: selectedConversation.participant_name,
      content: messageText,
      created_at: new Date().toISOString(),
      read: false
    };

    // Add message to local state instantly
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const messageData = {
        related_id: selectedConversation.event_request_id,
        message_type: 'event_request',
        sender_id: user.id,
        sender_name: optimisticMessage.sender_name,
        sender_role: 'location_owner' as const,
        receiver_id: selectedConversation.participant_id,
        receiver_name: selectedConversation.participant_name,
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

      // Refresh conversations to update last message
      fetchConversations();
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

  const filteredConversations = conversations.filter(conv =>
    conv.event_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.property_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/location-owner/dashboard')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Messages</h1>
              <p className="text-muted-foreground">Communicate with event organizers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Venue Owner</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  <CardTitle className="text-lg">Conversations</CardTitle>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-1">
                    {filteredConversations.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <h3 className="font-medium mb-2">No conversations yet</h3>
                        <p className="text-sm">Event organizers will appear here when they message you</p>
                      </div>
                    ) : (
                      filteredConversations.map((conversation) => (
                        <div
                          key={`${conversation.event_request_id}-${conversation.participant_id}`}
                          onClick={() => setSelectedConversation(conversation)}
                          className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                            selectedConversation?.event_request_id === conversation.event_request_id && 
                            selectedConversation?.participant_id === conversation.participant_id
                              ? 'bg-primary/10 border border-primary/20 shadow-sm'
                              : 'hover:bg-muted/50 active:bg-muted/80'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium truncate text-sm">{conversation.event_title}</h3>
                                {conversation.unread_count > 0 && (
                                  <Badge variant="destructive" className="text-xs px-2 py-0.5 h-5">
                                    {conversation.unread_count}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="w-3 h-3" />
                                <span className="truncate">{conversation.participant_name}</span>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="truncate">{conversation.participant_role === 'instructor' ? 'Instructor' : 'Student'}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{conversation.property_name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{conversation.start_date}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {conversation.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <Avatar className="w-6 h-6 flex-shrink-0">
                              <AvatarFallback className="text-xs bg-primary/10">
                                {getInitials(conversation.last_message.sender_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground truncate">
                                {conversation.last_message.sender_name}: {conversation.last_message.content}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Message Area */}
          <div className={`${
            selectedConversation ? 'w-full lg:w-2/3' : 'hidden lg:block lg:w-2/3'
          }`}>
            <Card className="h-full rounded-none border-0 shadow-none flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Fixed Conversation Header */}
                  <div className="bg-white border-b px-4 py-3 flex items-center gap-3 flex-shrink-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedConversation(null)}
                      className="lg:hidden"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/10 text-sm">
                        {getInitials(selectedConversation.participant_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h2 className="font-semibold text-lg">{selectedConversation.participant_name}</h2>
                      <p className="text-sm text-muted-foreground">
                        {selectedConversation.participant_role === 'instructor' ? 'Instructor' : 'Student'} • {selectedConversation.event_title}
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
                            Start the conversation with {selectedConversation.participant_name}
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
                </>
              ) : (
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center max-w-sm">
                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Select a conversation</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose a conversation from the list to start messaging
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueOwnerMessages;
