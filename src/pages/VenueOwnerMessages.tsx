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
  useLazyGetEventRequestsQuery,
} from "@/services/server";
import {
  sumUnreadCount,
  getOtherParticipant,
  getUserDisplayName,
  toLegacyMessage,
  conversationUnreadCount,
  toLegacyEventRequest,
} from "@/services/mappers";
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

const POLL_MS = 30000;

interface Conversation {
  conversation_id: string;
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
  const [triggerGetConversations] = useLazyGetConversationsQuery();
  const [triggerGetConversation] = useLazyGetConversationQuery();
  const [sendMessageMutation] = useSendMessageMutation();
  const [triggerGetEventRequests] = useLazyGetEventRequestsQuery();

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

  useEffect(() => {
    if (!user || role !== "location_owner") return;
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
      const [eventRequestItems, conversationItems] = await Promise.all([
        triggerGetEventRequests({ limit: 100 }).unwrap(),
        triggerGetConversations(undefined).unwrap(),
      ]);

      const legacyEvents = eventRequestItems.map((er) => toLegacyEventRequest(er));
      setEventRequests(legacyEvents);
      const eventById = new Map(legacyEvents.map((er) => [er.id, er]));

      const conversationsData: Conversation[] = [];

      for (const raw of conversationItems) {
        const c = raw as Record<string, unknown>;
        const other = getOtherParticipant(c, user.id);
        const otherUser = (other?.user ?? {}) as Record<string, unknown>;
        const otherId = String(other?.userId ?? otherUser.id ?? "");
        const lastRaw = Array.isArray(c.messages) ? (c.messages[0] as Record<string, unknown>) : null;
        const lastMessage = toLegacyMessage(lastRaw, { currentUserId: user.id });
        if (!lastMessage) continue;

        const unread = conversationUnreadCount(c, user.id);
        const venue = c.venue as Record<string, unknown> | undefined;

        if (c.eventRequestId) {
          const er = eventById.get(String(c.eventRequestId));
          conversationsData.push({
            conversation_id: String(c.id),
            event_request_id: String(c.eventRequestId),
            event_title: er?.event_title ?? String((c.retreat as Record<string, unknown>)?.title ?? "Event"),
            property_name: er?.property_name ?? String(venue?.name ?? ""),
            start_date: er?.start_date ?? "",
            end_date: er?.end_date ?? "",
            status: er?.status ?? "pending",
            last_message: { ...lastMessage, message_type: "event_request" },
            unread_count: unread,
            participant_id: otherId,
            participant_name: getUserDisplayName(otherUser),
            participant_role: "instructor",
          });
        } else if (c.venueId || c.context === "VENUE_REQUEST" || c.context === "GENERAL") {
          conversationsData.push({
            conversation_id: String(c.id),
            event_request_id: `direct-${otherId}`,
            event_title: "Venue Inquiry",
            property_name: String(venue?.name ?? "Direct Message"),
            start_date: new Date().toISOString().split("T")[0],
            end_date: new Date().toISOString().split("T")[0],
            status: "pending",
            last_message: { ...lastMessage, message_type: "event_request" },
            unread_count: unread,
            participant_id: otherId,
            participant_name: getUserDisplayName(otherUser),
            participant_role: "instructor",
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
    if (!newMessage.trim() || !selectedConversation || !user?.id || sending) return;

    setSending(true);
    const senderName =
      user.fullName ??
      [user.firstName, user.lastName].filter(Boolean).join(" ") ??
      user.email?.split("@")[0] ??
      "Venue Owner";

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      sender_name: senderName,
      sender_role: "location_owner",
      receiver_id: selectedConversation.participant_id,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
      read: false,
      message_type: "event_request",
      related_id: selectedConversation.event_request_id,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    const body = newMessage.trim();
    setNewMessage("");

    try {
      const sent = await sendMessageMutation({
        conversationId: selectedConversation.conversation_id,
        body: { body },
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
