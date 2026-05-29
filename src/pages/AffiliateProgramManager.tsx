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
import { useAuth } from "@/contexts/AuthContext";
import {
  useLazyListAllAffiliatesQuery,
  useLazyGetCampaignsQuery,
  useLazyListAllAffiliateLinksQuery,
  useLazyListAllReferralsQuery,
  useLazyListAllCommissionsQuery,
  useLazyListPayoutsQuery,
  useCreateAffiliateMutation,
  useUpdateAffiliateMutation,
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
  useCreateAdminAffiliateLinkMutation,
} from "@/services/server";
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

const mapAffiliate = (row: Record<string, unknown>): Affiliate => ({
  id: String(row.id),
  user_id: (row.userId ?? row.user_id ?? null) as string | null,
  name: String(row.name ?? ""),
  email: String(row.email ?? ""),
  affiliate_type: (row.affiliateType ?? row.affiliate_type ?? "other") as Affiliate["affiliate_type"],
  payout_method: (row.payoutMethod ?? row.payout_method ?? null) as Affiliate["payout_method"],
  payout_details: row.payoutDetails ?? row.payout_details,
  tax_info_status: (row.taxInfoStatus ?? row.tax_info_status ?? "pending") as Affiliate["tax_info_status"],
  country: (row.country ?? null) as string | null,
  status: (row.status ?? "pending") as Affiliate["status"],
  notes: (row.notes ?? null) as string | null,
  created_at: String(row.createdAt ?? row.created_at ?? ""),
  updated_at: String(row.updatedAt ?? row.updated_at ?? ""),
  profile: row.profile as Affiliate["profile"],
});

const mapCampaign = (row: Record<string, unknown>): Campaign => ({
  id: String(row.id),
  name: String(row.name ?? ""),
  description: (row.description ?? null) as string | null,
  target_type: (row.targetType ?? row.target_type ?? "student") as Campaign["target_type"],
  conversion_event: String(row.conversionEvent ?? row.conversion_event ?? ""),
  active_commission_type: (row.activeCommissionType ?? row.active_commission_type ?? null) as Campaign["active_commission_type"],
  active_commission_value: (row.activeCommissionValue ?? row.active_commission_value ?? null) as number | null,
  active_commission_base: (row.activeCommissionBase ?? row.active_commission_base ?? null) as string | null,
  passive_commission_enabled: Boolean(row.passiveCommissionEnabled ?? row.passive_commission_enabled),
  passive_commission_rate: (row.passiveCommissionRate ?? row.passive_commission_rate ?? null) as number | null,
  passive_commission_duration_months: (row.passiveCommissionDurationMonths ?? row.passive_commission_duration_months ?? null) as number | null,
  cookie_window_days: Number(row.cookieWindowDays ?? row.cookie_window_days ?? 30),
  attribution_model: (row.attributionModel ?? row.attribution_model ?? "last_click") as Campaign["attribution_model"],
  is_active: Boolean(row.isActive ?? row.is_active ?? true),
  created_at: String(row.createdAt ?? row.created_at ?? ""),
  updated_at: String(row.updatedAt ?? row.updated_at ?? ""),
});

const mapAffiliateLink = (row: Record<string, unknown>): AffiliateLink => ({
  id: String(row.id),
  affiliate_id: String(row.affiliateId ?? row.affiliate_id ?? ""),
  campaign_id: String(row.campaignId ?? row.campaign_id ?? ""),
  link_code: String(row.linkCode ?? row.link_code ?? ""),
  base_url: String(row.baseUrl ?? row.base_url ?? ""),
  full_url: String(row.fullUrl ?? row.full_url ?? ""),
  coupon_code: (row.couponCode ?? row.coupon_code ?? null) as string | null,
  clicks: Number(row.clicks ?? 0),
  created_at: String(row.createdAt ?? row.created_at ?? ""),
  affiliate: row.affiliate ? mapAffiliate(row.affiliate as Record<string, unknown>) : undefined,
  campaign: row.campaign ? mapCampaign(row.campaign as Record<string, unknown>) : undefined,
});

const mapReferral = (row: Record<string, unknown>): Referral => ({
  id: String(row.id),
  affiliate_id: String(row.affiliateId ?? row.affiliate_id ?? ""),
  campaign_id: String(row.campaignId ?? row.campaign_id ?? ""),
  referral_type: (row.referralType ?? row.referral_type ?? "student") as Referral["referral_type"],
  referred_user_id: (row.referredUserId ?? row.referred_user_id ?? null) as string | null,
  referred_venue_id: (row.referredVenueId ?? row.referred_venue_id ?? null) as string | null,
  converted: Boolean(row.converted),
  conversion_event_id: (row.conversionEventId ?? row.conversion_event_id ?? null) as string | null,
  conversion_event_type: (row.conversionEventType ?? row.conversion_event_type ?? null) as string | null,
  converted_at: (row.convertedAt ?? row.converted_at ?? null) as string | null,
  created_at: String(row.createdAt ?? row.created_at ?? ""),
  affiliate: row.affiliate ? mapAffiliate(row.affiliate as Record<string, unknown>) : undefined,
  campaign: row.campaign ? mapCampaign(row.campaign as Record<string, unknown>) : undefined,
});

const mapCommission = (row: Record<string, unknown>): Commission => ({
  id: String(row.id),
  affiliate_id: String(row.affiliateId ?? row.affiliate_id ?? ""),
  referral_id: String(row.referralId ?? row.referral_id ?? ""),
  campaign_id: String(row.campaignId ?? row.campaign_id ?? ""),
  commission_type: (row.commissionType ?? row.commission_type ?? "active") as Commission["commission_type"],
  amount: Number(row.amount ?? 0),
  currency: String(row.currency ?? "USD"),
  transaction_id: (row.transactionId ?? row.transaction_id ?? null) as string | null,
  transaction_amount: (row.transactionAmount ?? row.transaction_amount ?? null) as number | null,
  platform_fee: (row.platformFee ?? row.platform_fee ?? null) as number | null,
  status: (row.status ?? "pending") as Commission["status"],
  payout_id: (row.payoutId ?? row.payout_id ?? null) as string | null,
  notes: (row.notes ?? null) as string | null,
  created_at: String(row.createdAt ?? row.created_at ?? ""),
  approved_at: (row.approvedAt ?? row.approved_at ?? null) as string | null,
  paid_at: (row.paidAt ?? row.paid_at ?? null) as string | null,
  affiliate: row.affiliate ? mapAffiliate(row.affiliate as Record<string, unknown>) : undefined,
  referral: row.referral ? mapReferral(row.referral as Record<string, unknown>) : undefined,
});

const mapPayout = (row: Record<string, unknown>): Payout => ({
  id: String(row.id),
  affiliate_id: String(row.affiliateId ?? row.affiliate_id ?? ""),
  total_amount: Number(row.totalAmount ?? row.total_amount ?? 0),
  currency: String(row.currency ?? "USD"),
  payout_method: (row.payoutMethod ?? row.payout_method ?? "manual") as Payout["payout_method"],
  payout_details: row.payoutDetails ?? row.payout_details,
  status: (row.status ?? "queued") as Payout["status"],
  requested_at: String(row.requestedAt ?? row.requested_at ?? ""),
  processed_at: (row.processedAt ?? row.processed_at ?? null) as string | null,
  confirmed_at: (row.confirmedAt ?? row.confirmed_at ?? null) as string | null,
  notes: (row.notes ?? null) as string | null,
  affiliate: row.affiliate ? mapAffiliate(row.affiliate as Record<string, unknown>) : undefined,
});

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
  const [triggerListAllAffiliates] = useLazyListAllAffiliatesQuery();
  const [triggerGetCampaigns] = useLazyGetCampaignsQuery();
  const [triggerListAllAffiliateLinks] = useLazyListAllAffiliateLinksQuery();
  const [triggerListAllReferrals] = useLazyListAllReferralsQuery();
  const [triggerListAllCommissions] = useLazyListAllCommissionsQuery();
  const [triggerListPayouts] = useLazyListPayoutsQuery();
  const [createAffiliateMutation] = useCreateAffiliateMutation();
  const [updateAffiliateMutation] = useUpdateAffiliateMutation();
  const [createCampaignMutation] = useCreateCampaignMutation();
  const [updateCampaignMutation] = useUpdateCampaignMutation();
  const [createAdminAffiliateLinkMutation] = useCreateAdminAffiliateLinkMutation();

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
      const [affiliateRows, referralRows, commissionRows, linkRows] = await Promise.all([
        triggerListAllAffiliates().unwrap(),
        triggerListAllReferrals().unwrap(),
        triggerListAllCommissions().unwrap(),
        triggerListAllAffiliateLinks().unwrap(),
      ]);

      const affiliatesMapped = affiliateRows.map((row) => mapAffiliate(row as Record<string, unknown>));
      const referralsMapped = referralRows.map((row) => mapReferral(row));
      const commissionsMapped = commissionRows.map((row) => mapCommission(row as Record<string, unknown>));

      const totalCommissions = commissionsMapped.reduce((sum, c) => sum + Number(c.amount || 0), 0);
      const pendingCommissions = commissionsMapped
        .filter((c) => c.status === 'pending')
        .reduce((sum, c) => sum + Number(c.amount || 0), 0);
      const approvedCommissions = commissionsMapped
        .filter((c) => c.status === 'approved')
        .reduce((sum, c) => sum + Number(c.amount || 0), 0);
      const paidCommissions = commissionsMapped
        .filter((c) => c.status === 'paid')
        .reduce((sum, c) => sum + Number(c.amount || 0), 0);

      setOverviewStats({
        totalAffiliates: affiliatesMapped.length,
        activeAffiliates: affiliatesMapped.filter((a) => a.status === 'approved').length,
        pendingAffiliates: affiliatesMapped.filter((a) => a.status === 'pending').length,
        blockedAffiliates: affiliatesMapped.filter((a) => a.status === 'blocked' || a.status === 'suspended').length,
        totalClicks: linkRows.reduce((sum, link) => sum + Number((link as Record<string, unknown>).clicks ?? 0), 0),
        totalSignups: referralsMapped.length,
        totalConversions: referralsMapped.filter((r) => r.converted).length,
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
      const data = await triggerListAllAffiliates().unwrap();
      setAffiliates(data.map((row) => mapAffiliate(row as Record<string, unknown>)));
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
      const data = await triggerGetCampaigns().unwrap();
      setCampaigns(data.map((row) => mapCampaign(row as Record<string, unknown>)));
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
      const data = await triggerListAllAffiliateLinks().unwrap();
      setLinks(data.map((row) => mapAffiliateLink(row as Record<string, unknown>)));
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
      const params: Record<string, string | boolean> = {};
      if (referralFilters.affiliate_id) params.affiliateId = referralFilters.affiliate_id;
      if (referralFilters.referral_type) params.referralType = referralFilters.referral_type;
      if (referralFilters.converted !== '') params.converted = referralFilters.converted === 'true';

      const data = await triggerListAllReferrals(params).unwrap();
      setReferrals(data.map((row) => mapReferral(row)));
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
      const data = await triggerListAllCommissions().unwrap();
      setCommissions(data.slice(0, 100).map((row) => mapCommission(row as Record<string, unknown>)));
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
      const data = await triggerListPayouts().unwrap();
      setPayouts(data.map((row) => mapPayout(row as Record<string, unknown>)));
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
      const body = {
        name: affiliateForm.name,
        email: affiliateForm.email,
        affiliateType: affiliateForm.affiliate_type,
        payoutMethod: affiliateForm.payout_method,
        country: affiliateForm.country,
        status: affiliateForm.status,
        notes: affiliateForm.notes,
      };

      if (editingAffiliate) {
        await updateAffiliateMutation({ id: editingAffiliate.id, body }).unwrap();
        toast({
          title: "Success",
          description: "Affiliate updated successfully",
        });
      } else {
        await createAffiliateMutation(body).unwrap();
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
      const body = {
        name: campaignForm.name,
        description: campaignForm.description,
        targetType: campaignForm.target_type,
        conversionEvent: campaignForm.conversion_event,
        activeCommissionType: campaignForm.active_commission_type,
        activeCommissionValue: campaignForm.active_commission_value,
        activeCommissionBase: campaignForm.active_commission_base,
        passiveCommissionEnabled: campaignForm.passive_commission_enabled,
        passiveCommissionRate: campaignForm.passive_commission_rate,
        passiveCommissionDurationMonths: campaignForm.passive_commission_duration_months,
        cookieWindowDays: campaignForm.cookie_window_days,
        attributionModel: campaignForm.attribution_model,
        isActive: campaignForm.is_active,
      };

      if (editingCampaign) {
        await updateCampaignMutation({ id: editingCampaign.id, body }).unwrap();
        toast({
          title: "Success",
          description: "Campaign updated successfully",
        });
      } else {
        await createCampaignMutation(body).unwrap();
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
      await createAdminAffiliateLinkMutation({
        affiliateId: linkForm.affiliate_id,
        campaignId: linkForm.campaign_id,
        couponCode: linkForm.coupon_code || undefined,
      }).unwrap();

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
                              <div className="space-y-1">
                                <Badge variant="outline">
                                  {(() => {
                                    const affiliateLinks = links.filter(l => l.affiliate_id === affiliate.id);
                                    const uniqueCampaigns = new Set(affiliateLinks.map(l => l.campaign_id));
                                    return `${uniqueCampaigns.size} campaigns`;
                                  })()}
                                </Badge>
                                <Badge variant="secondary" className="block">
                                  {links.filter(l => l.affiliate_id === affiliate.id).length} links
                                </Badge>
                              </div>
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
                          
                          {/* Show affiliate's campaigns */}
                          {(() => {
                            const affiliateLinks = links.filter(l => l.affiliate_id === affiliate.id);
                            const affiliateCampaigns = Array.from(new Set(affiliateLinks.map(l => l.campaign_id)))
                              .map(campaignId => campaigns.find(c => c.id === campaignId))
                              .filter(Boolean);
                            
                            return affiliateCampaigns.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs font-medium text-muted-foreground mb-2">Campaigns ({affiliateCampaigns.length})</p>
                                <div className="space-y-2">
                                  {affiliateCampaigns.map((campaign) => (
                                    <div key={campaign!.id} className="p-2 bg-muted rounded">
                                      <p className="font-medium text-sm">{campaign!.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {campaign!.target_type} • {
                                          campaign!.active_commission_type === 'percentage' 
                                            ? `${campaign!.active_commission_value}%`
                                            : campaign!.active_commission_type === 'fixed'
                                            ? `$${campaign!.active_commission_value}`
                                            : 'No commission'}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Show affiliate's links */}
                          {links.filter(l => l.affiliate_id === affiliate.id).length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-medium text-muted-foreground">Links ({links.filter(l => l.affiliate_id === affiliate.id).length})</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-xs"
                                  onClick={() => {
                                    setLinkForm({ 
                                      affiliate_id: affiliate.id, 
                                      campaign_id: '', 
                                      coupon_code: '' 
                                    });
                                    setLinkDialogOpen(true);
                                  }}
                                >
                                  <LinkIcon className="w-3 h-3 mr-1" />
                                  Generate
                                </Button>
                              </div>
                              <div className="space-y-2">
                                {links.filter(l => l.affiliate_id === affiliate.id).map((link) => (
                                  <div key={link.id} className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate">{link.campaign?.name || 'Unknown Campaign'}</p>
                                      <p className="text-muted-foreground truncate">{link.full_url}</p>
                                      <p className="text-muted-foreground text-[10px] mt-0.5">{link.clicks} clicks</p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 flex-shrink-0"
                                      onClick={() => copyToClipboard(link.full_url)}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Generate Link Button if no links */}
                          {links.filter(l => l.affiliate_id === affiliate.id).length === 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
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
              <h2 className="text-xl font-semibold">Campaigns</h2>
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
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Campaigns</CardTitle>
                <CardDescription>Manage referral campaigns and commission rules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loadingCampaigns ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </div>
                  ) : campaigns.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No campaigns found</p>
                  ) : (
                    campaigns.map((campaign) => (
                      <Card key={campaign.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-lg">{campaign.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{campaign.description || 'No description'}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge variant="outline">{campaign.target_type}</Badge>
                              {campaign.active_commission_type && campaign.active_commission_type !== 'none' ? (
                                <Badge variant="secondary">
                                  {campaign.active_commission_type === 'percentage' 
                                    ? `${campaign.active_commission_value}%`
                                    : `$${campaign.active_commission_value}`}
                                  {' '}Active
                                </Badge>
                              ) : null}
                              {campaign.passive_commission_enabled && (
                                <Badge variant="default">
                                  {campaign.passive_commission_rate}% for {campaign.passive_commission_duration_months}mo
                                </Badge>
                              )}
                              {campaign.is_active ? (
                                <Badge variant="default" className="bg-green-600">Active</Badge>
                              ) : (
                                <Badge variant="destructive">Paused</Badge>
                              )}
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              <p>Conversion: {campaign.conversion_event}</p>
                              <p>Cookie Window: {campaign.cookie_window_days} days</p>
                              {campaign.passive_commission_enabled && (
                                <p className="text-green-600 font-medium">
                                  Passive: {campaign.passive_commission_rate}% for {campaign.passive_commission_duration_months} months
                                </p>
                              )}
                            </div>
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
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
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
                <Label>Active Commission Value</Label>
                <Input
                  type="number"
                  value={campaignForm.active_commission_value}
                  onChange={(e) => setCampaignForm({ ...campaignForm, active_commission_value: parseFloat(e.target.value) || 0 })}
                  disabled={campaignForm.active_commission_type === 'none'}
                />
              </div>
            </div>
            
            {/* Passive Commission Section */}
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Passive Commission (Recurring)</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ongoing commission for a set duration (e.g., 20% for 1 year)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="passive-enabled" className="text-sm">Enable</Label>
                  <input
                    id="passive-enabled"
                    type="checkbox"
                    checked={campaignForm.passive_commission_enabled}
                    onChange={(e) => setCampaignForm({ ...campaignForm, passive_commission_enabled: e.target.checked })}
                    className="w-4 h-4"
                  />
                </div>
              </div>
              
              {campaignForm.passive_commission_enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Passive Commission Rate (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={campaignForm.passive_commission_rate}
                      onChange={(e) => setCampaignForm({ ...campaignForm, passive_commission_rate: parseFloat(e.target.value) || 0 })}
                      placeholder="20"
                    />
                  </div>
                  <div>
                    <Label>Duration (months)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={campaignForm.passive_commission_duration_months}
                      onChange={(e) => setCampaignForm({ ...campaignForm, passive_commission_duration_months: parseInt(e.target.value) || 12 })}
                      placeholder="12"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cookie Window (days)</Label>
                <Input
                  type="number"
                  value={campaignForm.cookie_window_days}
                  onChange={(e) => setCampaignForm({ ...campaignForm, cookie_window_days: parseInt(e.target.value) || 30 })}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="campaign-active"
                  checked={campaignForm.is_active}
                  onChange={(e) => setCampaignForm({ ...campaignForm, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="campaign-active" className="cursor-pointer">
                  Campaign Active (Enable/Disable)
                </Label>
              </div>
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

