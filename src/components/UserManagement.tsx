import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Users, DollarSign, CreditCard, AlertCircle, CheckCircle, Clock, RefreshCw, Mail, Phone, Calendar, Search, Filter, Download, UserCheck, UserX, TrendingUp, Activity } from "lucide-react";

interface Booking {
  id: string;
  retreat_id: number;
  user_id: string;
  full_name: string;
  email: string;
  skill_level: string;
  payment_status: "deposit_paid" | "fully_paid" | "refunded" | "cancelled";
  deposit_amount?: number;
  full_amount?: number;
  payment_intent_id?: string;
  booking_date: string;
  refund_id?: string;
  refund_reason?: string;
  refund_date?: string;
  price_variant?: string;
  add_ons?: { id: string; name: string; price: number }[];
}

interface Retreat {
  id: number;
  title: string;
  date: string;
  location: string;
  price: number;
  deposit_amount?: number;
  total_spots: number;
  spots_available: number;
}

const UserManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [retreats, setRetreats] = useState<Retreat[]>([]);
  const [selectedRetreat, setSelectedRetreat] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [processingRefund, setProcessingRefund] = useState<string | null>(null);
  const [refundDialog, setRefundDialog] = useState<{ open: boolean; booking: Booking | null }>({ open: false, booking: null });
  const [refundReason, setRefundReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Calculate statistics
  const stats = {
    totalBookings: bookings.length,
    fullyPaid: bookings.filter(b => b.payment_status === 'fully_paid').length,
    depositPaid: bookings.filter(b => b.payment_status === 'deposit_paid').length,
    refunded: bookings.filter(b => b.payment_status === 'refunded').length,
    totalRevenue: bookings
      .filter(b => b.payment_status === 'fully_paid')
      .reduce((sum, b) => sum + (b.full_amount || 0), 0),
  };

  // Fetch retreats for the instructor
  useEffect(() => {
    const fetchRetreats = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('retreats')
          .select('id, title, date, location, price, deposit_amount, total_spots, spots_available')
          .eq('instructor_id', user.id)
          .eq('published', true)
          .order('date', { ascending: true });

        if (error) {
          console.error('Error fetching retreats:', error);
        } else {
          setRetreats(data || []);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      }
    };

    fetchRetreats();
  }, [user]);

  // Fetch bookings for instructor's retreats
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .in('retreat_id', retreats.map(r => r.id))
          .order('booking_date', { ascending: false });

        if (error) {
          console.error('Error fetching bookings:', error);
          toast({
            title: "Error",
            description: "Failed to load bookings",
            variant: "destructive",
          });
        } else {
          setBookings(data || []);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (retreats.length > 0) {
      fetchBookings();
    } else {
      setLoading(false);
    }
  }, [user, retreats, toast]);

  // Filter bookings based on selected retreat and search term
  const filteredBookings = bookings.filter((booking) => {
    const matchesRetreat = selectedRetreat === "all" || booking.retreat_id === Number(selectedRetreat);
    const matchesSearch = searchTerm === "" || 
      booking.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRetreat && matchesSearch;
  });

  // Get retreat details for a booking
  const getRetreatDetails = (retreatId: number) => {
    return retreats.find(r => r.id === retreatId);
  };

  // Process refund
  const processRefund = async (booking: Booking) => {
    if (!refundReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for the refund",
        variant: "destructive",
      });
      return;
    }

    setProcessingRefund(booking.id);

    try {
      // In a real implementation, this would call Stripe API to process refund
      // For now, we'll simulate the refund process
      
      const { error } = await supabase
        .from('bookings')
        .update({
          payment_status: 'refunded',
          refund_reason: refundReason.trim(),
          refund_date: new Date().toISOString(),
        })
        .eq('id', booking.id);

      if (error) {
        throw error;
      }

      // Update local state
      setBookings(prev => prev.map(b => 
        b.id === booking.id 
          ? { ...b, payment_status: 'refunded', refund_reason: refundReason.trim(), refund_date: new Date().toISOString() }
          : b
      ));

      toast({
        title: "Refund Processed",
        description: "Refund has been successfully processed",
      });

      setRefundDialog({ open: false, booking: null });
      setRefundReason("");
    } catch (error: any) {
      console.error('Error processing refund:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process refund",
        variant: "destructive",
      });
    } finally {
      setProcessingRefund(null);
    }
  };

  // Get payment status badge
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'deposit_paid':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Deposit Paid</Badge>;
      case 'fully_paid':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Fully Paid</Badge>;
      case 'refunded':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Refunded</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // Get payment status icon
  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'deposit_paid':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'fully_paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'refunded':
        return <RefreshCw className="w-4 h-4 text-red-600" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading user registrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground flex items-center gap-2">
            <Users className="w-6 h-6" />
            User Management
          </h2>
          <p className="text-muted-foreground">Manage registered users and payment status</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm px-3 py-1">
            {filteredBookings.length} Total Bookings
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="p-4 border-2 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-card-foreground">{stats.totalBookings}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Total Bookings</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-2 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-card-foreground">{stats.fullyPaid}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Fully Paid</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-2 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-card-foreground">{stats.depositPaid}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Deposit Paid</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-2 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-xl">
              <RefreshCw className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-card-foreground">{stats.refunded}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Refunded</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-2 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-card-foreground">${stats.totalRevenue.toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Total Revenue</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Label className="text-sm font-medium mb-2 block">Filter by Retreat</Label>
              <Select value={selectedRetreat} onValueChange={setSelectedRetreat}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Retreats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Retreats</SelectItem>
                  {retreats.map((retreat) => (
                    <SelectItem key={retreat.id} value={retreat.id.toString()}>
                      {retreat.title} - {retreat.date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-sm font-medium mb-2 block">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Registered Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No registered users found</h3>
              <p className="text-muted-foreground mb-4">
                {selectedRetreat === "all" 
                  ? "No users have registered for your retreats yet" 
                  : "No users have registered for this retreat yet"}
              </p>
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="border-b-2">
                        <TableHead className="px-6 py-4 font-semibold text-card-foreground">User</TableHead>
                        <TableHead className="px-6 py-4 font-semibold text-card-foreground">Retreat</TableHead>
                        <TableHead className="px-6 py-4 font-semibold text-card-foreground">Skill Level</TableHead>
                        <TableHead className="px-6 py-4 font-semibold text-card-foreground">Payment Status</TableHead>
                        <TableHead className="px-6 py-4 font-semibold text-card-foreground">Amount</TableHead>
                        <TableHead className="px-6 py-4 font-semibold text-card-foreground">Booking Date</TableHead>
                        <TableHead className="px-6 py-4 font-semibold text-card-foreground text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.map((booking, index) => {
                        const retreat = getRetreatDetails(booking.retreat_id);
                        return (
                          <TableRow 
                            key={booking.id} 
                            className={`border-b hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
                          >
                            <TableCell className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="font-semibold text-card-foreground">{booking.full_name}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                  <Mail className="w-3 h-3" />
                                  {booking.email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="font-medium text-card-foreground">{retreat?.title}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                  <Calendar className="w-3 h-3" />
                                  {retreat?.date}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
                                {booking.skill_level}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {getPaymentStatusIcon(booking.payment_status)}
                                <div>
                                  {getPaymentStatusBadge(booking.payment_status)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <div className="space-y-2">
                                <div className="font-semibold text-card-foreground text-lg">
                                  ${booking.full_amount || retreat?.price || 0}
                                </div>
                                {booking.deposit_amount && (
                                  <div className="text-sm text-muted-foreground">
                                    Deposit: ${booking.deposit_amount}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <div className="text-sm text-muted-foreground">
                                {new Date(booking.booking_date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <div className="flex justify-center">
                                {booking.payment_status === 'fully_paid' && (
                                  <Dialog
                                    open={refundDialog.open && refundDialog.booking?.id === booking.id}
                                    onOpenChange={(open) => setRefundDialog({ open, booking: open ? booking : null })}
                                  >
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 transition-colors"
                                      >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Refund
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md">
                                      <DialogHeader>
                                        <DialogTitle className="text-lg font-semibold">Process Refund</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div className="p-4 bg-muted/50 rounded-lg">
                                          <p className="text-sm text-muted-foreground mb-2">Refunding booking for:</p>
                                          <p className="font-medium">{booking.full_name}</p>
                                          <p className="text-sm text-muted-foreground">${booking.full_amount || retreat?.price || 0}</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium mb-2 block">Refund Reason</Label>
                                          <Textarea
                                            value={refundReason}
                                            onChange={(e) => setRefundReason(e.target.value)}
                                            placeholder="Please provide a reason for this refund..."
                                            rows={3}
                                            className="resize-none"
                                          />
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                          <Button
                                            variant="outline"
                                            onClick={() => setRefundDialog({ open: false, booking: null })}
                                            className="flex-1"
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            onClick={() => booking && processRefund(booking)}
                                            disabled={processingRefund === booking.id}
                                            className="flex-1 bg-red-600 hover:bg-red-700"
                                          >
                                            {processingRefund === booking.id ? "Processing..." : "Process Refund"}
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {filteredBookings.map((booking, index) => {
                  const retreat = getRetreatDetails(booking.retreat_id);
                  return (
                    <Card key={booking.id} className="border-2 hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="space-y-4">
                          {/* Header with user info and status */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-lg text-card-foreground truncate">{booking.full_name}</h4>
                              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                <Mail className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{booking.email}</span>
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2 ml-4">
                              {getPaymentStatusIcon(booking.payment_status)}
                              {getPaymentStatusBadge(booking.payment_status)}
                            </div>
                          </div>
                          
                          {/* Retreat Information */}
                          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium text-card-foreground">{retreat?.title}</span>
                            </div>
                            <div className="text-sm text-muted-foreground ml-6">
                              {retreat?.date}
                            </div>
                          </div>
                          
                          {/* Details Grid */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                              <p className="font-medium text-card-foreground">Skill Level</p>
                              <Badge variant="outline" className="text-xs px-2 py-1">
                                {booking.skill_level}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium text-card-foreground">Booked</p>
                              <p className="text-muted-foreground">
                                {new Date(booking.booking_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          
                          {/* Payment Information */}
                          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">Total Amount</p>
                                <p className="text-2xl font-bold text-card-foreground">
                                  ${booking.full_amount || retreat?.price || 0}
                                </p>
                                {booking.deposit_amount && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Deposit: ${booking.deposit_amount}
                                  </p>
                                )}
                              </div>
                              <div className="p-3 bg-white rounded-lg shadow-sm">
                                <DollarSign className="w-6 h-6 text-green-600" />
                              </div>
                            </div>
                          </div>
                          
                          {/* Refund Action */}
                          {booking.payment_status === 'fully_paid' && (
                            <div className="pt-3 border-t">
                              <Dialog
                                open={refundDialog.open && refundDialog.booking?.id === booking.id}
                                onOpenChange={(open) => setRefundDialog({ open, booking: open ? booking : null })}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 transition-colors py-3"
                                  >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Process Refund
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle className="text-lg font-semibold">Process Refund</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                      <p className="text-sm text-muted-foreground mb-2">Refunding booking for:</p>
                                      <p className="font-medium">{booking.full_name}</p>
                                      <p className="text-sm text-muted-foreground">${booking.full_amount || retreat?.price || 0}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium mb-2 block">Refund Reason</Label>
                                      <Textarea
                                        value={refundReason}
                                        onChange={(e) => setRefundReason(e.target.value)}
                                        placeholder="Please provide a reason for this refund..."
                                        rows={3}
                                        className="resize-none"
                                      />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                      <Button
                                        variant="outline"
                                        onClick={() => setRefundDialog({ open: false, booking: null })}
                                        className="flex-1"
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        onClick={() => booking && processRefund(booking)}
                                        disabled={processingRefund === booking.id}
                                        className="flex-1 bg-red-600 hover:bg-red-700"
                                      >
                                        {processingRefund === booking.id ? "Processing..." : "Process Refund"}
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
