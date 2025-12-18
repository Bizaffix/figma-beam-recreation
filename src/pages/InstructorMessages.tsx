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
  Phone,
  Mail,
  Clock
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

interface Conversation {
  retreat_id: string;
  retreat_title: string;
  retreat_location: string;
  retreat_date: string;
  retreat_level: string;
  last_message: Message;
  unread_count: number;
  participant_id: string;
  participant_name: string;
  participant_role: string;
}

interface Retreat {
  id: number;
  title: string;
  location: string;
  date: string;
  level: string;
}

const InstructorMessages = () => {
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
  const [retreats, setRetreats] = useState<Retreat[]>([]);
  const [eventRequests, setEventRequests] = useState<any[]>([]);

  useEffect(() => {
    if (role !== 'instructor') {
      navigate('/instructor/dashboard');
      return;
    }

    fetchConversations();
  }, [user, role, navigate]);

  // Filter conversations based on selected event and search term
  const filteredConversations = conversations.filter((conversation) => {
    const isVenueConversation = conversation.retreat_id.startsWith('event-');
    const isRetreatConversation = !isVenueConversation;
    
    let matchesEvent = true;
    
    if (selectedEventFilter === "retreats") {
      matchesEvent = isRetreatConversation;
    } else if (selectedEventFilter === "venues") {
      matchesEvent = isVenueConversation;
    } else if (selectedEventFilter === "all") {
      matchesEvent = true;
    } else {
      // Specific retreat or event request
      matchesEvent = conversation.retreat_id === selectedEventFilter ||
        (isVenueConversation && conversation.retreat_id.replace('event-', '') === selectedEventFilter);
    }
    
    const matchesSearch = searchTerm === "" || 
      conversation.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.retreat_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.last_message.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesEvent && matchesSearch;
  });

  useEffect(() => {
    if (!user || role !== 'instructor') return;

    const channel = supabase
      .channel('messages')
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
          // Handle both retreat, event request, and direct message conversations
          if (selectedConversation && 
              selectedConversation.participant_id === newMessage.sender_id) {
            
            // Check if this message belongs to the current conversation
            const isCurrentRetreat = selectedConversation.retreat_id === newMessage.related_id;
            const isCurrentEventRequest = newMessage.related_id && 
              `event-${newMessage.related_id}` === selectedConversation.retreat_id;
            const isCurrentDirectMessage = newMessage.message_type === 'venue_communication' ||
              (newMessage.message_type === 'event_request' && 
               selectedConversation.retreat_id.startsWith('direct-') &&
               selectedConversation.participant_id === newMessage.sender_id);
            
            if (isCurrentRetreat || isCurrentEventRequest || isCurrentDirectMessage) {
              fetchMessages(selectedConversation.retreat_id);
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
      fetchMessages(selectedConversation.retreat_id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      console.log('Starting fetchConversations for instructor:', user?.id);
      
      // Get all retreats for this instructor
      const { data: retreatsData, error: retreatsError } = await supabase
        .from('retreats')
        .select('id, title, location, date, level')
        .eq('instructor_id', user?.id)
        .eq('published', true);

      if (retreatsError) throw retreatsError;
      console.log('Retreats data:', retreatsData);
      setRetreats(retreatsData || []);

      // Get all event requests for this instructor
      const { data: eventRequestsData, error: eventRequestsError } = await supabase
        .from('event_requests')
        .select('*')
        .eq('instructor_id', user?.id);

      if (eventRequestsError) throw eventRequestsError;
      console.log('Event requests data:', eventRequestsData);
      setEventRequests(eventRequestsData || []);

      // Also get any messages received by this instructor from venue owners
      const { data: receivedMessages, error: receivedMessagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('receiver_id', user?.id)
        .in('message_type', ['event_request', 'venue_communication'])
        .eq('sender_role', 'location_owner')
        .order('created_at', { ascending: false });

      if (receivedMessagesError) throw receivedMessagesError;
      console.log('Received messages from venue owners:', receivedMessages);

      // Also get any direct messages sent by this instructor to venue owners
      const { data: directMessages, error: directMessagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', user?.id)
        .in('message_type', ['event_request', 'venue_communication'])
        .eq('sender_role', 'instructor')
        .order('created_at', { ascending: false });

      if (directMessagesError) throw directMessagesError;
      console.log('Direct messages data:', directMessages);

      // Combine received and sent direct messages, filter out event request messages that are already handled
      const allDirectMessages = [...(receivedMessages || []), ...(directMessages || [])]
        .filter(msg => {
          // Include venue_communication messages and event_request messages that don't have existing event requests
          if (msg.message_type === 'venue_communication') return true;
          if (msg.message_type === 'event_request') {
            // Only include if related_id doesn't match an existing event request
            return !eventRequestsData?.some(req => req.id === msg.related_id);
          }
          return false;
        });
      console.log('All direct messages combined:', allDirectMessages);

      const conversationsData: Conversation[] = [];
      const processedEventIds = new Set<string>();

      // Process retreat conversations (with students)
      for (const retreat of retreatsData || []) {
        // Get all unique students who have messaged about this retreat
        const { data: studentMessages, error: studentMessagesError } = await supabase
          .from('messages')
          .select('sender_id, sender_name, sender_role, created_at, content')
          .eq('related_id', retreat.id.toString())
          .eq('message_type', 'retreat_question')
          .eq('sender_role', 'student')
          .order('created_at', { ascending: false });

        if (studentMessagesError) throw studentMessagesError;

        // Group messages by student to create separate conversations
        const studentGroups = studentMessages?.reduce((groups: Record<string, any[]>, message) => {
          if (!groups[message.sender_id]) {
            groups[message.sender_id] = [];
          }
          groups[message.sender_id].push(message);
          return groups;
        }, {});

        // Create a conversation for each student
        for (const [studentId, messages] of Object.entries(studentGroups || {})) {
          const lastMessage = messages[0]; // Most recent message
          
          // Count unread messages for this specific student
          const { count, error: countError } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('related_id', retreat.id.toString())
            .eq('message_type', 'retreat_question')
            .eq('sender_id', studentId)
            .eq('sender_role', 'student')
            .eq('read', false);

          if (countError) throw countError;

          conversationsData.push({
            retreat_id: retreat.id.toString(),
            retreat_title: retreat.title,
            retreat_location: retreat.location,
            retreat_date: retreat.date,
            retreat_level: retreat.level,
            last_message: {
              id: `temp-${lastMessage.id}`,
              sender_id: lastMessage.sender_id,
              sender_name: lastMessage.sender_name,
              sender_role: lastMessage.sender_role,
              content: lastMessage.content,
              created_at: lastMessage.created_at,
              read: false,
              message_type: 'retreat_question',
              related_id: retreat.id.toString()
            },
            unread_count: count || 0,
            participant_id: studentId,
            participant_name: lastMessage.sender_name,
            participant_role: 'student'
          });
        }
      }

      // Process event request conversations (with venue owners)
      for (const eventRequest of eventRequestsData || []) {
        processedEventIds.add(eventRequest.id);
        
        // Get all messages between instructor and venue owner for this event request
        const { data: venueMessages, error: venueMessagesError } = await supabase
          .from('messages')
          .select('id, sender_id, sender_name, sender_role, created_at, content, read, receiver_id')
          .eq('related_id', eventRequest.id)
          .eq('message_type', 'event_request')
          .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
          .order('created_at', { ascending: false });

        if (venueMessagesError) throw venueMessagesError;

        if (venueMessages && venueMessages.length > 0) {
          const lastMessage = venueMessages[0];
          
          // Count unread messages from venue owner
          const unreadCount = venueMessages.filter(m => 
            m.sender_id !== user?.id && 
            m.receiver_id && m.receiver_id === user?.id && 
            m.read === false
          ).length;

          // Create a conversation for the venue owner
          conversationsData.push({
            retreat_id: `event-${eventRequest.id}`, // Use event request ID with prefix
            retreat_title: `Venue: ${eventRequest.property_name}`,
            retreat_location: eventRequest.property_name,
            retreat_date: eventRequest.start_date,
            retreat_level: 'Venue Communication', // Different level to distinguish
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
            participant_id: eventRequest.property_owner_id,
            participant_name: 'Property Owner', // We'll need to fetch this from profiles
            participant_role: 'location_owner'
          });
        }
      }

      // Process direct messages that aren't associated with existing event requests
      console.log('Processing direct messages...');
      const groupedDirectMessages = allDirectMessages?.reduce((groups: Record<string, any[]>, message) => {
        // Group by the other participant (either sender or receiver)
        const otherParticipantId = message.sender_id === user?.id ? message.receiver_id : message.sender_id;
        const key = `direct-${otherParticipantId}`;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(message);
        return groups;
      }, {});

      console.log('Grouped direct messages:', groupedDirectMessages);

      for (const [key, messages] of Object.entries(groupedDirectMessages || {})) {
        const messageGroup = messages as any[];
        const lastMessage = messageGroup[0];
        
        console.log('Processing direct message group:', key, messageGroup);
        
        // Determine the other participant
        const otherParticipantId = lastMessage.sender_id === user?.id ? lastMessage.receiver_id : lastMessage.sender_id;
        const otherParticipantName = lastMessage.sender_id === user?.id ? 'Property Owner' : lastMessage.sender_name;
        const isFromInstructor = lastMessage.sender_id === user?.id;
        
        // Count unread messages (only count messages received from venue owners that are unread)
        const unreadCount = messageGroup.filter(m => 
          m.sender_id !== user?.id && 
          m.receiver_id === user?.id && 
          m.read === false
        ).length;

        console.log('Creating conversation for direct message:', key, 'unread:', unreadCount, 'other participant:', otherParticipantId);

        conversationsData.push({
          retreat_id: key,
          retreat_title: 'Venue Inquiry',
          retreat_location: 'Direct Message',
          retreat_date: new Date().toISOString().split('T')[0],
          retreat_level: 'Venue Communication',
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
          participant_id: otherParticipantId,
          participant_name: otherParticipantName,
          participant_role: 'location_owner'
        });
      }

      console.log('Final conversations data:', conversationsData);

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

  const fetchMessages = async (retreatId: string) => {
    if (!selectedConversation) return;
    
    try {
      // Determine if this is an event request, retreat, or direct conversation
      const isEventRequest = retreatId.startsWith('event-');
      const isDirectMessage = retreatId.startsWith('direct-');
      const actualId = isEventRequest ? retreatId.replace('event-', '') : 
                      isDirectMessage ? `direct-${selectedConversation.participant_id}` : retreatId;
      const messageType = isEventRequest || isDirectMessage ? 'event_request' : 'retreat_question';
      
      let data;
      
      if (isDirectMessage) {
        // For direct messages, fetch by participant and message type
        const { data: directData, error: directError } = await supabase
          .from('messages')
          .select('*')
          .eq('message_type', messageType)
          .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${selectedConversation.participant_id}),and(sender_id.eq.${selectedConversation.participant_id},receiver_id.eq.${user?.id})`)
          .order('created_at', { ascending: true });
        
        if (directError) throw directError;
        data = directData;
      } else {
        // For event request and retreat messages, fetch by related_id
        const { data: relatedData, error: relatedError } = await supabase
          .from('messages')
          .select('*')
          .eq('related_id', actualId)
          .eq('message_type', messageType)
          .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
          .order('created_at', { ascending: true });

        if (relatedError) throw relatedError;
        data = relatedData;
      }

      setMessages(data || []);

      // Mark messages as read
      if (data && data.length > 0) {
        const unreadMessages = data.filter(m => m.receiver_id === user.id && !m.read);
        if (unreadMessages.length > 0) {
          await supabase
            .from('messages')
            .update({ read: true })
            .eq('receiver_id', user.id)
            .eq('message_type', messageType)
            .in('id', unreadMessages.map(m => m.id));
        }
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

    // Determine if this is an event request, retreat, or direct conversation
    const isEventRequest = selectedConversation.retreat_id.startsWith('event-');
    const isDirectMessage = selectedConversation.retreat_id.startsWith('direct-');
    const actualId = isEventRequest ? selectedConversation.retreat_id.replace('event-', '') : 
                    isDirectMessage ? `direct-${selectedConversation.participant_id}` : selectedConversation.retreat_id;
    const messageType = isEventRequest || isDirectMessage ? 'event_request' : 'retreat_question';

    // Create optimistic message for instant display
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`, // Temporary ID
      related_id: actualId,
      message_type: messageType,
      sender_id: user.id,
      sender_name: user.user_metadata?.first_name && user.user_metadata?.last_name 
        ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
        : user.email?.split('@')[0] || 'Instructor',
      sender_role: 'instructor' as const,
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
        related_id: actualId,
        message_type: messageType,
        sender_id: user.id,
        sender_name: optimisticMessage.sender_name,
        sender_role: 'instructor' as const,
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
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/instructor/dashboard')}
                className="lg:hidden"
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
          <div className="space-y-3">
            {/* Event Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-foreground whitespace-nowrap">Event:</label>
              <Select value={selectedEventFilter} onValueChange={setSelectedEventFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="retreats">Retreats Only</SelectItem>
                  <SelectItem value="venues">Venue Communications Only</SelectItem>
                  {retreats.map((retreat) => (
                    <SelectItem key={retreat.id} value={retreat.id.toString()}>
                      {retreat.title}
                    </SelectItem>
                  ))}
                  {eventRequests.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      Venue: {event.property_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-140px)]">
        {/* Conversations List - Mobile First */}
        <div className={`${
          selectedConversation ? 'hidden lg:block lg:w-1/3' : 'w-full lg:w-1/3'
        } border-r`}>
          <Card className="h-full rounded-none border-0 shadow-none">
            <CardContent className="p-0">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-1">
                  {filteredConversations.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="font-medium mb-2">No conversations yet</h3>
                      <p className="text-sm">Students will appear here when they message you</p>
                    </div>
                  ) : (
                    filteredConversations.map((conversation) => (
                      <div
                        key={`${conversation.retreat_id}-${conversation.participant_id}`}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedConversation?.retreat_id === conversation.retreat_id && 
                          selectedConversation?.participant_id === conversation.participant_id
                            ? 'bg-primary/10 border border-primary/20 shadow-sm'
                            : 'hover:bg-muted/50 active:bg-muted/80'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium truncate text-sm">{conversation.retreat_title}</h3>
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
                              <span className="truncate">{conversation.participant_role === 'student' ? 'Student' : 'Instructor'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{conversation.retreat_location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{conversation.retreat_date}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {conversation.retreat_level}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(conversation.last_message.created_at), 'MMM d')}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {conversation.last_message.content}
                        </p>
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
                      {selectedConversation.participant_role === 'student' ? 'Student' : 'Instructor'} • {selectedConversation.retreat_title}
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
  );
};

export default InstructorMessages;
