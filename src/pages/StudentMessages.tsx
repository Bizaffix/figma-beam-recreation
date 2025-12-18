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

const StudentMessages = () => {
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

  useEffect(() => {
    if (role !== 'student') {
      navigate('/home');
      return;
    }

    fetchConversations();
  }, [user, role, navigate]);

  // Filter conversations based on selected event and search term
  const filteredConversations = conversations.filter((conversation) => {
    const matchesEvent = selectedEventFilter === "all" || conversation.retreat_id === selectedEventFilter;
    const matchesSearch = searchTerm === "" || 
      conversation.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.retreat_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.last_message.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesEvent && matchesSearch;
  });

  useEffect(() => {
    if (!user || role !== 'student') return;

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
          if (selectedConversation && 
              selectedConversation.participant_id === newMessage.sender_id &&
              selectedConversation.retreat_id === newMessage.related_id) {
            fetchMessages(selectedConversation.retreat_id);
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
      // Get all messages involving this student for retreat questions
      const { data: studentMessages, error: messagesError } = await supabase
        .from('messages')
        .select('id, sender_id, sender_name, sender_role, receiver_id, created_at, content, read, related_id')
        .eq('message_type', 'retreat_question')
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Group messages by retreat_id and get unique retreats
      const retreatIds = [...new Set(studentMessages?.map(m => m.related_id) || [])];
      
      // Get retreat details for all retreats that have conversations
      const { data: retreatsData, error: retreatsError } = await supabase
        .from('retreats')
        .select('id, title, location, date, level, instructor_id')
        .in('id', retreatIds.map(id => parseInt(id)));

      if (retreatsError) throw retreatsError;
      setRetreats(retreatsData || []);

      // For each retreat, create conversation from messages
      const conversationsData: Conversation[] = [];

      for (const retreat of retreatsData || []) {
        // Get all messages for this retreat
        const retreatMessages = studentMessages?.filter(m => m.related_id === retreat.id.toString()) || [];
        
        if (retreatMessages.length > 0) {
          // Find the most recent message
          const lastMessage = retreatMessages[0];
          
          // Find the other participant (instructor)
          const instructorMessage = retreatMessages.find(m => m.sender_id !== user?.id);
          const participantId = instructorMessage?.sender_id || retreat.instructor_id;
          const participantName = instructorMessage?.sender_name || 'Instructor';
          
          // Count unread messages from instructor
          const unreadCount = retreatMessages.filter(m => 
            m.sender_id !== user?.id && 
            m.receiver_id && m.receiver_id === user?.id && 
            m.read === false
          ).length;

          conversationsData.push({
            retreat_id: retreat.id.toString(),
            retreat_title: retreat.title,
            retreat_location: retreat.location,
            retreat_date: retreat.date,
            retreat_level: retreat.level,
            last_message: {
              id: lastMessage.id,
              sender_id: lastMessage.sender_id,
              sender_name: lastMessage.sender_name,
              sender_role: lastMessage.sender_role,
              content: lastMessage.content,
              created_at: lastMessage.created_at,
              read: lastMessage.read || false,
              message_type: 'retreat_question',
              related_id: retreat.id.toString()
            },
            unread_count: unreadCount,
            participant_id: participantId,
            participant_name: participantName,
            participant_role: 'instructor'
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

  const fetchMessages = async (retreatId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('related_id', retreatId)
        .eq('message_type', 'retreat_question')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      const unreadMessages = data?.filter(m => m.receiver_id === user.id && !m.read);
      if (unreadMessages && unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('receiver_id', user.id)
          .eq('read', false);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        sender_id: user.id,
        sender_name: user.user_metadata?.first_name && user.user_metadata?.last_name 
          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
          : user.email?.split('@')[0] || 'Student',
        sender_role: 'student',
        receiver_id: selectedConversation.participant_id,
        receiver_name: selectedConversation.participant_name,
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
        read: false,
        message_type: 'retreat_question',
        related_id: selectedConversation.retreat_id
      };

      // Add optimistic message
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage("");

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          sender_name: optimisticMessage.sender_name,
          sender_role: 'student',
          receiver_id: selectedConversation.participant_id,
          receiver_name: selectedConversation.participant_name,
          content: optimisticMessage.content,
          message_type: 'retreat_question',
          related_id: selectedConversation.retreat_id
        })
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic message with real message
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id ? data : msg
      ));

      // Refresh conversations to update last message
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  const formatDateForSeparator = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/home')}
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
                {retreats.map((retreat) => (
                  <SelectItem key={retreat.id} value={retreat.id.toString()}>
                    {retreat.title}
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
                      <p className="text-sm">Your conversations with instructors will appear here</p>
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
                              <span className="truncate">{conversation.participant_role === 'instructor' ? 'Instructor' : 'Student'}</span>
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
                      {selectedConversation.participant_role === 'instructor' ? 'Instructor' : 'Student'} • {selectedConversation.retreat_title}
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
                                  {formatMessageTime(message.created_at)}
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

export default StudentMessages;
