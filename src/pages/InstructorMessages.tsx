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
import {
  useLazyGetConversationsQuery,
  useLazyGetConversationQuery,
  useSendMessageMutation,
  useLazyGetMyRetreatsQuery,
  useLazyGetEventRequestsQuery,
} from "@/services/server";
import {
  mapRetreatForCard,
  sumUnreadCount,
  getOtherParticipant,
  getUserDisplayName,
  toLegacyMessage,
  conversationUnreadCount,
  toLegacyEventRequest,
} from "@/services/mappers";
import { format, isToday, isYesterday } from "date-fns";
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

const POLL_MS = 30000;

interface Conversation {
  conversation_id: string;
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
  const [triggerGetConversations] = useLazyGetConversationsQuery();
  const [triggerGetConversation] = useLazyGetConversationQuery();
  const [sendMessageMutation] = useSendMessageMutation();
  const [triggerGetMyRetreats] = useLazyGetMyRetreatsQuery();
  const [triggerGetEventRequests] = useLazyGetEventRequestsQuery();

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
    if (!user || role !== "instructor") return;
    const interval = setInterval(fetchConversations, POLL_MS);
    return () => clearInterval(interval);
  }, [user, role]);

  useEffect(() => {
    if (!selectedConversation?.conversation_id) return;
    fetchMessages(selectedConversation.conversation_id);
    const interval = setInterval(
      () => fetchMessages(selectedConversation.conversation_id),
      POLL_MS,
    );
    return () => clearInterval(interval);
  }, [selectedConversation?.conversation_id]);

  const fetchConversations = async () => {
    if (!user?.id) return;
    try {
      const [retreatItems, eventRequestItems, conversationItems] = await Promise.all([
        triggerGetMyRetreats({ limit: 100 }).unwrap(),
        triggerGetEventRequests({ limit: 100 }).unwrap(),
        triggerGetConversations(undefined).unwrap(),
      ]);

      const publishedRetreats = retreatItems
        .filter((r) => String(r.status ?? "").toLowerCase() === "published")
        .map((r) => {
          const card = mapRetreatForCard(r);
          return {
            id: Number(card.id),
            title: card.title,
            location: card.location,
            date: card.date,
            level: card.level,
          };
        });
      setRetreats(publishedRetreats);

      const legacyEvents = eventRequestItems.map((er) => toLegacyEventRequest(er));
      setEventRequests(legacyEvents);
      const eventById = new Map(legacyEvents.map((er) => [er.id, er]));

      const conversationsData: Conversation[] = [];

      for (const raw of conversationItems) {
        const c = raw as Record<string, unknown>;
        const other = getOtherParticipant(c, user.id);
        const otherUser = (other?.user ?? {}) as Record<string, unknown>;
        const otherId = String(other?.userId ?? otherUser.id ?? "");
        const otherRole = String(otherUser.role ?? "student");
        const lastRaw = Array.isArray(c.messages) ? (c.messages[0] as Record<string, unknown>) : null;
        const lastMessage = toLegacyMessage(lastRaw, { currentUserId: user.id });
        if (!lastMessage) continue;

        const unread = conversationUnreadCount(c, user.id);
        const venue = c.venue as Record<string, unknown> | undefined;

        if (c.eventRequestId) {
          const er = eventById.get(String(c.eventRequestId));
          conversationsData.push({
            conversation_id: String(c.id),
            retreat_id: `event-${c.eventRequestId}`,
            retreat_title: er ? `Venue: ${er.property_name}` : `Venue: ${getUserDisplayName(venue)}`,
            retreat_location: er?.property_name ?? String(venue?.name ?? ""),
            retreat_date: er?.start_date ?? "",
            retreat_level: "Venue Communication",
            last_message: { ...lastMessage, message_type: "event_request" },
            unread_count: unread,
            participant_id: otherId,
            participant_name: getUserDisplayName(otherUser) || "Property Owner",
            participant_role: "location_owner",
          });
        } else if (c.retreatId) {
          const card = c.retreat ? mapRetreatForCard(c.retreat as Record<string, unknown>) : null;
          conversationsData.push({
            conversation_id: String(c.id),
            retreat_id: String(c.retreatId),
            retreat_title: card?.title ?? String((c.retreat as Record<string, unknown>)?.title ?? "Retreat"),
            retreat_location: card?.location ?? "",
            retreat_date: card?.date ?? "",
            retreat_level: card?.level ?? "",
            last_message: lastMessage,
            unread_count: unread,
            participant_id: otherId,
            participant_name: getUserDisplayName(otherUser),
            participant_role: otherRole === "student" ? "student" : "instructor",
          });
        } else if (c.venueId || c.context === "VENUE_REQUEST" || c.context === "GENERAL") {
          conversationsData.push({
            conversation_id: String(c.id),
            retreat_id: `direct-${otherId}`,
            retreat_title: "Venue Inquiry",
            retreat_location: String(venue?.name ?? "Direct Message"),
            retreat_date: new Date().toISOString().split("T")[0],
            retreat_level: "Venue Communication",
            last_message: { ...lastMessage, message_type: "event_request" },
            unread_count: unread,
            participant_id: otherId,
            participant_name: getUserDisplayName(otherUser) || "Property Owner",
            participant_role: "location_owner",
          });
        }
      }

      conversationsData.sort(
        (a, b) =>
          new Date(b.last_message.created_at).getTime() -
          new Date(a.last_message.created_at).getTime(),
      );

      setConversations(conversationsData);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    if (!user?.id) return;
    try {
      const data = await triggerGetConversation(conversationId).unwrap();
      const mapped = (data.messages ?? [])
        .map((m) => toLegacyMessage(m as Record<string, unknown>, { currentUserId: user.id }))
        .filter((m) => m != null) as Message[];
      setMessages(mapped);
      fetchConversations();
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user?.id) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setSending(true);

    const senderName =
      user.fullName ??
      [user.firstName, user.lastName].filter(Boolean).join(" ") ??
      user.email?.split("@")[0] ??
      "Instructor";

    const isEventRequest = selectedConversation.retreat_id.startsWith("event-");
    const isDirectMessage = selectedConversation.retreat_id.startsWith("direct-");
    const messageType = isEventRequest || isDirectMessage ? "event_request" : "retreat_question";

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      related_id: selectedConversation.retreat_id,
      message_type: messageType,
      sender_id: user.id,
      sender_name: senderName,
      sender_role: "instructor",
      receiver_id: selectedConversation.participant_id,
      receiver_name: selectedConversation.participant_name,
      content: messageText,
      created_at: new Date().toISOString(),
      read: false,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const sent = await sendMessageMutation({
        conversationId: selectedConversation.conversation_id,
        body: { body: messageText },
      }).unwrap();
      const legacy = toLegacyMessage(sent as Record<string, unknown>, { currentUserId: user.id });
      if (legacy) {
        setMessages((prev) => prev.map((msg) => (msg.id === optimisticMessage.id ? legacy : msg)));
      }
      fetchConversations();
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
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
                  {sumUnreadCount(conversations, user?.id) > 0
                    ? `${sumUnreadCount(conversations, user?.id)} unread`
                    : "All caught up!"}
                </p>
              </div>
            </div>
            {sumUnreadCount(conversations, user?.id) > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {sumUnreadCount(conversations, user?.id)}
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
