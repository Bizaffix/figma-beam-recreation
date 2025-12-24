import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Plus, 
  Loader2, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Link as LinkIcon,
  Copy,
  Check,
  Edit,
  Trash2,
  X,
  Save,
  Download,
  Eye,
  Calendar,
  Filter,
  Search
} from "lucide-react";

// Types
interface Affiliate {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  affiliate_type: 'content_creator' | 'organizer_partner' | 'venue_partner' | 'other';
  payout_method: 'stripe_connect' | 'paypal' | 'bank_transfer' | 'manual' | null;
  payout_details: any;
  tax_info_status: 'pending' | 'submitted' | 'verified' | 'not_required';
  country: string | null;
  status: 'pending' | 'approved' | 'blocked' | 'suspended';
  notes: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string | null;
    email: string;
  };
}

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  target_type: 'student' | 'organizer' | 'venue';
  conversion_event: string;
  active_commission_type: 'fixed' | 'percentage' | 'none' | null;
  active_commission_value: number | null;
  active_commission_base: string | null;
  passive_commission_enabled: boolean;
  passive_commission_rate: number | null;
  passive_commission_duration_months: number | null;
  cookie_window_days: number;
  attribution_model: 'last_click' | 'first_click';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AffiliateLink {
  id: string;
  affiliate_id: string;
  campaign_id: string;
  link_code: string;
  base_url: string;
  full_url: string;
  coupon_code: string | null;
  clicks: number;
  created_at: string;
  affiliate?: Affiliate;
  campaign?: Campaign;
}

interface Referral {
  id: string;
  affiliate_id: string;
  campaign_id: string;
  referral_type: 'student' | 'organizer' | 'venue';
  referred_user_id: string | null;
  referred_venue_id: string | null;
  converted: boolean;
  conversion_event_id: string | null;
  conversion_event_type: string | null;
  converted_at: string | null;
  created_at: string;
  affiliate?: Affiliate;
  campaign?: Campaign;
}

interface Commission {
  id: string;
  affiliate_id: string;
  referral_id: string;
  campaign_id: string;
  commission_type: 'active' | 'passive';
  amount: number;
  currency: string;
  transaction_id: string | null;
  transaction_amount: number | null;
  platform_fee: number | null;
  status: 'pending' | 'approved' | 'paid' | 'void' | 'disputed' | 'on_hold';
  payout_id: string | null;
  notes: string | null;
  created_at: string;
  approved_at: string | null;
  paid_at: string | null;
  affiliate?: Affiliate;
  referral?: Referral;
}

interface Payout {
  id: string;
  affiliate_id: string;
  total_amount: number;
  currency: string;
  payout_method: 'stripe_connect' | 'paypal' | 'bank_transfer' | 'manual';
  payout_details: any;
  status: 'queued' | 'processing' | 'sent' | 'confirmed' | 'failed';
  requested_at: string;
  processed_at: string | null;
  confirmed_at: string | null;
  notes: string | null;
  affiliate?: Affiliate;
}

const AffiliateProgramManager = () => {
  const { role, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Overview stats
  const [overviewStats, setOverviewStats] = useState({
    totalAffiliates: 0,
    activeAffiliates: 0,
    pendingAffiliates: 0,
    blockedAffiliates: 0,
    totalClicks: 0,
    totalSignups: 0,
    totalConversions: 0,
    totalCommissions: 0,
    pendingCommissions: 0,
    approvedCommissions: 0,
    paidCommissions: 0,
  });

  // Affiliates
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loadingAffiliates, setLoadingAffiliates] = useState(false);
  const [affiliateDialogOpen, setAffiliateDialogOpen] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
  const [affiliateForm, setAffiliateForm] = useState<{
    name: string;
    email: string;
    affiliate_type: 'content_creator' | 'organizer_partner' | 'venue_partner' | 'other';
    payout_method: 'stripe_connect' | 'paypal' | 'bank_transfer' | 'manual';
    country: string;
    status: 'pending' | 'approved' | 'blocked' | 'suspended';
    notes: string;
  }>({
    name: '',
    email: '',
    affiliate_type: 'content_creator',
    payout_method: 'stripe_connect',
    country: '',
    status: 'pending',
    notes: '',
  });

  // Campaigns
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [campaignForm, setCampaignForm] = useState<{
    name: string;
    description: string;
    target_type: 'student' | 'organizer' | 'venue';
    conversion_event: string;
    active_commission_type: 'fixed' | 'percentage' | 'none';
    active_commission_value: number;
    active_commission_base: string;
    passive_commission_enabled: boolean;
    passive_commission_rate: number;
    passive_commission_duration_months: number;
    cookie_window_days: number;
    attribution_model: 'last_click' | 'first_click';
    is_active: boolean;
  }>({
    name: '',
    description: '',
    target_type: 'student',
    conversion_event: '',
    active_commission_type: 'percentage',
    active_commission_value: 0,
    active_commission_base: 'platform_fee',
    passive_commission_enabled: false,
    passive_commission_rate: 0,
    passive_commission_duration_months: 12,
    cookie_window_days: 30,
    attribution_model: 'last_click',
    is_active: true,
  });

  // Links
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkForm, setLinkForm] = useState({
    affiliate_id: '',
    campaign_id: '',
    coupon_code: '',
  });

  // Referrals & Commissions
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [loadingCommissions, setLoadingCommissions] = useState(false);
  const [referralFilters, setReferralFilters] = useState({
    dateFrom: '',
    dateTo: '',
    affiliate_id: '',
    referral_type: '',
    converted: '',
  });

  // Payouts
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);

  useEffect(() => {
    if (role !== 'admin' || !user) {
      navigate('/admin/dashboard');
      return;
    }
    fetchOverviewStats();
    fetchAffiliates();
    fetchCampaigns();
    fetchLinks();
    fetchReferrals();
    fetchCommissions();
    fetchPayouts();
  }, [role, user, navigate]);

  const fetchOverviewStats = async () => {
    try {
      // Total affiliates
      const { count: totalCount } = await supabase
        .from('affiliates')
        .select('*', { count: 'exact', head: true });

      const { count: activeCount } = await supabase
        .from('affiliates')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      const { count: pendingCount } = await supabase
        .from('affiliates')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: blockedCount } = await supabase
        .from('affiliates')
        .select('*', { count: 'exact', head: true })
        .in('status', ['blocked', 'suspended']);

      // Total clicks
      const { data: clicksData } = await supabase
        .from('affiliate_link_clicks')
        .select('id', { count: 'exact', head: true });

      // Total referrals (signups)
      const { count: signupsCount } = await supabase
        .from('affiliate_referrals')
        .select('*', { count: 'exact', head: true });

      // Total conversions
      const { count: conversionsCount } = await supabase
        .from('affiliate_referrals')
        .select('*', { count: 'exact', head: true })
        .eq('converted', true);

      // Commissions
      const { data: commissionsData } = await supabase
        .from('affiliate_commissions')
        .select('amount, status');

      const totalCommissions = commissionsData?.reduce((sum, c) => sum + Number(c.amount || 0), 0) || 0;
      const pendingCommissions = commissionsData?.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.amount || 0), 0) || 0;
      const approvedCommissions = commissionsData?.filter(c => c.status === 'approved').reduce((sum, c) => sum + Number(c.amount || 0), 0) || 0;
      const paidCommissions = commissionsData?.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.amount || 0), 0) || 0;

      setOverviewStats({
        totalAffiliates: totalCount || 0,
        activeAffiliates: activeCount || 0,
        pendingAffiliates: pendingCount || 0,
        blockedAffiliates: blockedCount || 0,
        totalClicks: clicksData?.length || 0,
        totalSignups: signupsCount || 0,
        totalConversions: conversionsCount || 0,
        totalCommissions,
        pendingCommissions,
        approvedCommissions,
        paidCommissions,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching overview stats:', error);
      setLoading(false);
    }
  };

  const fetchAffiliates = async () => {
    setLoadingAffiliates(true);
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Optionally fetch profile data separately if user_id exists
      if (data && data.length > 0) {
        const userIds = data.filter(a => a.user_id).map(a => a.user_id);
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds);
          
          // Merge profile data into affiliates
          const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
          const affiliatesWithProfiles = data.map(affiliate => ({
            ...affiliate,
            profile: affiliate.user_id ? profilesMap.get(affiliate.user_id) : null
          }));
          setAffiliates(affiliatesWithProfiles);
          return;
        }
      }
      
      setAffiliates(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load affiliates",
        variant: "destructive",
      });
    } finally {
      setLoadingAffiliates(false);
    }
  };

  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const { data, error } = await supabase
        .from('affiliate_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load campaigns",
        variant: "destructive",
      });
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const fetchLinks = async () => {
    setLoadingLinks(true);
    try {
      const { data, error } = await supabase
        .from('affiliate_links')
        .select(`
          *,
          affiliate:affiliates(*),
          campaign:affiliate_campaigns(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load links",
        variant: "destructive",
      });
    } finally {
      setLoadingLinks(false);
    }
  };

  const fetchReferrals = async () => {
    setLoadingReferrals(true);
    try {
      let query = supabase
        .from('affiliate_referrals')
        .select(`
          *,
          affiliate:affiliates(*),
          campaign:affiliate_campaigns(*)
        `)
        .order('created_at', { ascending: false });

      if (referralFilters.affiliate_id) {
        query = query.eq('affiliate_id', referralFilters.affiliate_id);
      }
      if (referralFilters.referral_type) {
        query = query.eq('referral_type', referralFilters.referral_type);
      }
      if (referralFilters.converted !== '') {
        query = query.eq('converted', referralFilters.converted === 'true');
      }

      const { data, error } = await query;

      if (error) throw error;
      setReferrals(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load referrals",
        variant: "destructive",
      });
    } finally {
      setLoadingReferrals(false);
    }
  };

  const fetchCommissions = async () => {
    setLoadingCommissions(true);
    try {
      const { data, error } = await supabase
        .from('affiliate_commissions')
        .select(`
          *,
          affiliate:affiliates(*),
          referral:affiliate_referrals(*)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setCommissions(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load commissions",
        variant: "destructive",
      });
    } finally {
      setLoadingCommissions(false);
    }
  };

  const fetchPayouts = async () => {
    setLoadingPayouts(true);
    try {
      const { data, error } = await supabase
        .from('affiliate_payouts')
        .select(`
          *,
          affiliate:affiliates(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayouts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load payouts",
        variant: "destructive",
      });
    } finally {
      setLoadingPayouts(false);
    }
  };

  const handleSaveAffiliate = async () => {
    try {
      if (editingAffiliate) {
        const { error } = await supabase
          .from('affiliates')
          .update(affiliateForm)
          .eq('id', editingAffiliate.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Affiliate updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('affiliates')
          .insert([affiliateForm]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Affiliate created successfully",
        });
      }
      setAffiliateDialogOpen(false);
      setEditingAffiliate(null);
      setAffiliateForm({
        name: '',
        email: '',
        affiliate_type: 'content_creator',
        payout_method: 'stripe_connect',
        country: '',
        status: 'pending',
        notes: '',
      });
      fetchAffiliates();
      fetchOverviewStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save affiliate",
        variant: "destructive",
      });
    }
  };

  const handleSaveCampaign = async () => {
    try {
      if (editingCampaign) {
        const { error } = await supabase
          .from('affiliate_campaigns')
          .update(campaignForm)
          .eq('id', editingCampaign.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Campaign updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('affiliate_campaigns')
          .insert([campaignForm]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Campaign created successfully",
        });
      }
      setCampaignDialogOpen(false);
      setEditingCampaign(null);
      fetchCampaigns();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save campaign",
        variant: "destructive",
      });
    }
  };

  const generateAffiliateLink = async () => {
    if (!linkForm.affiliate_id || !linkForm.campaign_id) {
      toast({
        title: "Error",
        description: "Please select affiliate and campaign",
        variant: "destructive",
      });
      return;
    }

    try {
      const baseUrl = window.location.origin;
      const linkCode = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fullUrl = `${baseUrl}?ref=${linkCode}`;

      const { data, error } = await supabase
        .from('affiliate_links')
        .insert([{
          affiliate_id: linkForm.affiliate_id,
          campaign_id: linkForm.campaign_id,
          link_code: linkCode,
          base_url: baseUrl,
          full_url: fullUrl,
          coupon_code: linkForm.coupon_code || null,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Affiliate link generated successfully",
      });
      setLinkDialogOpen(false);
      setLinkForm({ affiliate_id: '', campaign_id: '', coupon_code: '' });
      fetchLinks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate link",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Link copied to clipboard",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero p-4">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-64 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero pb-20">
      {/* Header */}
      <div className="bg-gradient-primary text-white px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/dashboard')}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Affiliate Program Manager</h1>
              <p className="text-white/90 text-sm sm:text-lg">Manage affiliates, campaigns, and payouts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 -mt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile: Horizontal scrollable tabs */}
          <div className="md:hidden mb-6 -mx-4 sm:-mx-6 px-4 sm:px-6">
            <div className="overflow-x-auto scrollbar-hide pb-2">
              <TabsList className="inline-flex w-auto min-w-full h-auto p-1 gap-1">
                <TabsTrigger 
                  value="overview" 
                  className="text-sm whitespace-nowrap px-4 py-2.5 min-w-[90px] flex-shrink-0"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="affiliates" 
                  className="text-sm whitespace-nowrap px-4 py-2.5 min-w-[90px] flex-shrink-0"
                >
                  Affiliates
                </TabsTrigger>
                <TabsTrigger 
                  value="campaigns" 
                  className="text-sm whitespace-nowrap px-4 py-2.5 min-w-[90px] flex-shrink-0"
                >
                  Campaigns
                </TabsTrigger>
                <TabsTrigger 
                  value="ledger" 
                  className="text-sm whitespace-nowrap px-4 py-2.5 min-w-[90px] flex-shrink-0"
                >
                  Ledger
                </TabsTrigger>
                <TabsTrigger 
                  value="payouts" 
                  className="text-sm whitespace-nowrap px-4 py-2.5 min-w-[90px] flex-shrink-0"
                >
                  Payouts
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
          
          {/* Desktop: Grid layout */}
          <div className="hidden md:block mb-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="ledger">Ledger</TabsTrigger>
              <TabsTrigger value="payouts">Payouts</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Affiliates</p>
                      <p className="text-2xl font-bold">{overviewStats.totalAffiliates}</p>
                    </div>
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="mt-2 flex gap-2 text-xs">
                    <Badge variant="outline">{overviewStats.activeAffiliates} Active</Badge>
                    <Badge variant="outline">{overviewStats.pendingAffiliates} Pending</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Clicks</p>
                      <p className="text-2xl font-bold">{overviewStats.totalClicks.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {overviewStats.totalSignups} Signups • {overviewStats.totalConversions} Conversions
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Commissions</p>
                      <p className="text-2xl font-bold">${overviewStats.totalCommissions.toFixed(2)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="mt-2 flex gap-2 text-xs">
                    <Badge variant="outline">${overviewStats.pendingCommissions.toFixed(2)} Pending</Badge>
                    <Badge variant="outline">${overviewStats.paidCommissions.toFixed(2)} Paid</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Conversion Rate</p>
                      <p className="text-2xl font-bold">
                        {overviewStats.totalSignups > 0 
                          ? ((overviewStats.totalConversions / overviewStats.totalSignups) * 100).toFixed(1)
                          : '0.0'}%
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest referrals and commissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {referrals.slice(0, 10).map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {referral.affiliate?.name || 'Unknown'} referred a {referral.referral_type}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(referral.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={referral.converted ? "default" : "outline"}>
                        {referral.converted ? "Converted" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Affiliates Tab */}
          <TabsContent value="affiliates" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold">Manage Affiliates</h2>
              <Button className="w-full sm:w-auto" onClick={() => {
                setEditingAffiliate(null);
                setAffiliateForm({
                  name: '',
                  email: '',
                  affiliate_type: 'content_creator',
                  payout_method: 'stripe_connect',
                  country: '',
                  status: 'pending',
                  notes: '',
                });
                setAffiliateDialogOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Affiliate
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payout Method</TableHead>
                        <TableHead>Links</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingAffiliates ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : affiliates.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No affiliates found
                          </TableCell>
                        </TableRow>
                      ) : (
                        affiliates.map((affiliate) => (
                          <TableRow key={affiliate.id}>
                            <TableCell>{affiliate.name}</TableCell>
                            <TableCell>{affiliate.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{affiliate.affiliate_type.replace('_', ' ')}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  affiliate.status === 'approved' ? 'default' :
                                  affiliate.status === 'pending' ? 'secondary' :
                                  'destructive'
                                }
                              >
                                {affiliate.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{affiliate.payout_method || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {links.filter(l => l.affiliate_id === affiliate.id).length} links
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingAffiliate(affiliate);
                                    setAffiliateForm({
                                      name: affiliate.name,
                                      email: affiliate.email,
                                      affiliate_type: affiliate.affiliate_type,
                                      payout_method: affiliate.payout_method || 'stripe_connect',
                                      country: affiliate.country || '',
                                      status: affiliate.status,
                                      notes: affiliate.notes || '',
                                    });
                                    setAffiliateDialogOpen(true);
                                  }}
                                  title="Edit Affiliate"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setLinkForm({ 
                                      affiliate_id: affiliate.id, 
                                      campaign_id: '', 
                                      coupon_code: '' 
                                    });
                                    setLinkDialogOpen(true);
                                  }}
                                  title="Generate Link"
                                >
                                  <LinkIcon className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden p-4 space-y-4">
                  {loadingAffiliates ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </div>
                  ) : affiliates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No affiliates found
                    </div>
                  ) : (
                    affiliates.map((affiliate) => (
                      <Card key={affiliate.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{affiliate.name}</h3>
                              <p className="text-sm text-muted-foreground">{affiliate.email}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingAffiliate(affiliate);
                                setAffiliateForm({
                                  name: affiliate.name,
                                  email: affiliate.email,
                                  affiliate_type: affiliate.affiliate_type,
                                  payout_method: affiliate.payout_method || 'stripe_connect',
                                  country: affiliate.country || '',
                                  status: affiliate.status,
                                  notes: affiliate.notes || '',
                                });
                                setAffiliateDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{affiliate.affiliate_type.replace('_', ' ')}</Badge>
                            <Badge 
                              variant={
                                affiliate.status === 'approved' ? 'default' :
                                affiliate.status === 'pending' ? 'secondary' :
                                'destructive'
                              }
                            >
                              {affiliate.status}
                            </Badge>
                          </div>
                          <div className="text-sm">
                            <p><span className="text-muted-foreground">Payout:</span> {affiliate.payout_method || 'N/A'}</p>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                setLinkForm({ 
                                  affiliate_id: affiliate.id, 
                                  campaign_id: '', 
                                  coupon_code: '' 
                                });
                                setLinkDialogOpen(true);
                              }}
                            >
                              <LinkIcon className="w-4 h-4 mr-2" />
                              Generate Link
                            </Button>
                          </div>
                          {/* Show affiliate's links */}
                          {links.filter(l => l.affiliate_id === affiliate.id).length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Links ({links.filter(l => l.affiliate_id === affiliate.id).length})</p>
                              <div className="space-y-2">
                                {links.filter(l => l.affiliate_id === affiliate.id).slice(0, 2).map((link) => (
                                  <div key={link.id} className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate">{link.campaign?.name || 'Unknown'}</p>
                                      <p className="text-muted-foreground truncate">{link.full_url}</p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => copyToClipboard(link.full_url)}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                                {links.filter(l => l.affiliate_id === affiliate.id).length > 2 && (
                                  <p className="text-xs text-muted-foreground">
                                    +{links.filter(l => l.affiliate_id === affiliate.id).length - 2} more
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold">Campaigns & Links</h2>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => {
                  setEditingCampaign(null);
                  setCampaignForm({
                    name: '',
                    description: '',
                    target_type: 'student',
                    conversion_event: 'completed_booking',
                    active_commission_type: 'percentage',
                    active_commission_value: 20,
                    active_commission_base: 'platform_fee',
                    passive_commission_enabled: false,
                    passive_commission_rate: 0,
                    passive_commission_duration_months: 12,
                    cookie_window_days: 30,
                    attribution_model: 'last_click',
                    is_active: true,
                  });
                  setCampaignDialogOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Campaign
                </Button>
                <Button className="w-full sm:w-auto" onClick={() => {
                  setLinkForm({ affiliate_id: '', campaign_id: '', coupon_code: '' });
                  setLinkDialogOpen(true);
                }}>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Generate Link
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Campaigns List */}
              <Card>
                <CardHeader>
                  <CardTitle>Campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {loadingCampaigns ? (
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    ) : campaigns.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No campaigns found</p>
                    ) : (
                      campaigns.map((campaign) => (
                        <div key={campaign.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{campaign.name}</h4>
                              <p className="text-sm text-muted-foreground">{campaign.target_type}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {campaign.active_commission_type === 'percentage' 
                                  ? `${campaign.active_commission_value}%`
                                  : campaign.active_commission_type === 'fixed'
                                  ? `$${campaign.active_commission_value}`
                                  : 'No commission'}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingCampaign(campaign);
                                setCampaignForm({
                                  name: campaign.name,
                                  description: campaign.description || '',
                                  target_type: campaign.target_type,
                                  conversion_event: campaign.conversion_event,
                                  active_commission_type: campaign.active_commission_type || 'percentage',
                                  active_commission_value: campaign.active_commission_value || 0,
                                  active_commission_base: campaign.active_commission_base || 'platform_fee',
                                  passive_commission_enabled: campaign.passive_commission_enabled,
                                  passive_commission_rate: campaign.passive_commission_rate || 0,
                                  passive_commission_duration_months: campaign.passive_commission_duration_months || 12,
                                  cookie_window_days: campaign.cookie_window_days,
                                  attribution_model: campaign.attribution_model,
                                  is_active: campaign.is_active,
                                });
                                setCampaignDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Links List */}
              <Card>
                <CardHeader>
                  <CardTitle>Affiliate Links</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {loadingLinks ? (
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    ) : links.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No links found</p>
                    ) : (
                      links.map((link) => (
                        <div key={link.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{link.affiliate?.name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">{link.campaign?.name || 'Unknown Campaign'}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {link.clicks} clicks
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(link.full_url)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Input
                              value={link.full_url}
                              readOnly
                              className="text-xs flex-1 min-w-0"
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Ledger Tab */}
          <TabsContent value="ledger" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold">Referral & Commission Ledger</h2>
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => {
                // Export CSV functionality
                const csv = [
                  ['Date', 'Affiliate', 'Type', 'Status', 'Amount', 'Transaction ID'].join(','),
                  ...commissions.map(c => [
                    new Date(c.created_at).toLocaleDateString(),
                    c.affiliate?.name || 'Unknown',
                    c.commission_type,
                    c.status,
                    c.amount,
                    c.transaction_id || '',
                  ].join(','))
                ].join('\n');
                
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `commissions-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
              }}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Affiliate</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Transaction</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingCommissions ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : commissions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No commissions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        commissions.map((commission) => (
                          <TableRow key={commission.id}>
                            <TableCell>{new Date(commission.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>{commission.affiliate?.name || 'Unknown'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{commission.commission_type}</Badge>
                            </TableCell>
                            <TableCell>${commission.amount.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  commission.status === 'paid' ? 'default' :
                                  commission.status === 'approved' ? 'secondary' :
                                  commission.status === 'pending' ? 'outline' :
                                  'destructive'
                                }
                              >
                                {commission.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {commission.transaction_id || 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden p-4 space-y-4">
                  {loadingCommissions ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </div>
                  ) : commissions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No commissions found
                    </div>
                  ) : (
                    commissions.map((commission) => (
                      <Card key={commission.id} className="p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{commission.affiliate?.name || 'Unknown'}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(commission.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge 
                              variant={
                                commission.status === 'paid' ? 'default' :
                                commission.status === 'approved' ? 'secondary' :
                                commission.status === 'pending' ? 'outline' :
                                'destructive'
                              }
                            >
                              {commission.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              <Badge variant="outline">{commission.commission_type}</Badge>
                            </div>
                            <p className="font-semibold text-lg">${commission.amount.toFixed(2)}</p>
                          </div>
                          {commission.transaction_id && (
                            <p className="text-xs text-muted-foreground">
                              Transaction: {commission.transaction_id}
                            </p>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Payout Center</h2>
            </div>

            <Card>
              <CardContent className="p-0">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Affiliate</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requested</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingPayouts ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : payouts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No payouts found
                          </TableCell>
                        </TableRow>
                      ) : (
                        payouts.map((payout) => (
                          <TableRow key={payout.id}>
                            <TableCell>{payout.affiliate?.name || 'Unknown'}</TableCell>
                            <TableCell>${payout.total_amount.toFixed(2)}</TableCell>
                            <TableCell>{payout.payout_method}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  payout.status === 'confirmed' ? 'default' :
                                  payout.status === 'sent' ? 'secondary' :
                                  payout.status === 'processing' ? 'outline' :
                                  'destructive'
                                }
                              >
                                {payout.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(payout.requested_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden p-4 space-y-4">
                  {loadingPayouts ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </div>
                  ) : payouts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No payouts found
                    </div>
                  ) : (
                    payouts.map((payout) => (
                      <Card key={payout.id} className="p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{payout.affiliate?.name || 'Unknown'}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(payout.requested_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge 
                              variant={
                                payout.status === 'confirmed' ? 'default' :
                                payout.status === 'sent' ? 'secondary' :
                                payout.status === 'processing' ? 'outline' :
                                'destructive'
                              }
                            >
                              {payout.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">{payout.payout_method}</p>
                            <p className="font-semibold text-lg">${payout.total_amount.toFixed(2)}</p>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Affiliate Dialog */}
      <Dialog open={affiliateDialogOpen} onOpenChange={setAffiliateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{editingAffiliate ? 'Edit Affiliate' : 'Add Affiliate'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={affiliateForm.name}
                onChange={(e) => setAffiliateForm({ ...affiliateForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={affiliateForm.email}
                onChange={(e) => setAffiliateForm({ ...affiliateForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Affiliate Type</Label>
              <Select
                value={affiliateForm.affiliate_type}
                onValueChange={(value: any) => setAffiliateForm({ ...affiliateForm, affiliate_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="content_creator">Content Creator</SelectItem>
                  <SelectItem value="organizer_partner">Organizer Partner</SelectItem>
                  <SelectItem value="venue_partner">Venue Partner</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payout Method</Label>
              <Select
                value={affiliateForm.payout_method}
                onValueChange={(value: any) => setAffiliateForm({ ...affiliateForm, payout_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stripe_connect">Stripe Connect</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={affiliateForm.status}
                onValueChange={(value: any) => setAffiliateForm({ ...affiliateForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Country</Label>
              <Input
                value={affiliateForm.country}
                onChange={(e) => setAffiliateForm({ ...affiliateForm, country: e.target.value })}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={affiliateForm.notes}
                onChange={(e) => setAffiliateForm({ ...affiliateForm, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAffiliateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAffiliate}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Campaign Dialog */}
      <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? 'Edit Campaign' : 'New Campaign'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Campaign Name</Label>
              <Input
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={campaignForm.description}
                onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label>Target Type</Label>
              <Select
                value={campaignForm.target_type}
                onValueChange={(value: any) => setCampaignForm({ ...campaignForm, target_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="organizer">Organizer</SelectItem>
                  <SelectItem value="venue">Venue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Conversion Event</Label>
              <Input
                value={campaignForm.conversion_event}
                onChange={(e) => setCampaignForm({ ...campaignForm, conversion_event: e.target.value })}
                placeholder="e.g., completed_booking, organizer_verified"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Active Commission Type</Label>
                <Select
                  value={campaignForm.active_commission_type}
                  onValueChange={(value: any) => setCampaignForm({ ...campaignForm, active_commission_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Commission Value</Label>
                <Input
                  type="number"
                  value={campaignForm.active_commission_value}
                  onChange={(e) => setCampaignForm({ ...campaignForm, active_commission_value: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <Label>Cookie Window (days)</Label>
              <Input
                type="number"
                value={campaignForm.cookie_window_days}
                onChange={(e) => setCampaignForm({ ...campaignForm, cookie_window_days: parseInt(e.target.value) || 30 })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCampaignDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCampaign}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generate Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Generate Affiliate Link</DialogTitle>
            <DialogDescription>
              Create a unique tracking link for an affiliate and campaign
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Affiliate</Label>
              <Select
                value={linkForm.affiliate_id}
                onValueChange={(value) => setLinkForm({ ...linkForm, affiliate_id: value })}
                disabled={!!linkForm.affiliate_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select affiliate" />
                </SelectTrigger>
                <SelectContent>
                  {affiliates.filter(a => a.status === 'approved').map((affiliate) => (
                    <SelectItem key={affiliate.id} value={affiliate.id}>
                      {affiliate.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {linkForm.affiliate_id && (
                <p className="text-xs text-muted-foreground mt-1">
                  Affiliate pre-selected from affiliate list
                </p>
              )}
            </div>
            <div>
              <Label>Campaign</Label>
              <Select
                value={linkForm.campaign_id}
                onValueChange={(value) => setLinkForm({ ...linkForm, campaign_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.filter(c => c.is_active).map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Coupon Code (Optional)</Label>
              <Input
                value={linkForm.coupon_code}
                onChange={(e) => setLinkForm({ ...linkForm, coupon_code: e.target.value })}
                placeholder="e.g., AFFILIATE10"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={generateAffiliateLink}>
                Generate Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AffiliateProgramManager;

