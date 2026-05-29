/** Pure presentation mappers — no HTTP. All API calls go through @/services/server (RTK Query). */

export function toLegacyRetreat(r: Record<string, unknown>) {
  const instructor = r.instructor as Record<string, unknown> | undefined;
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    location: r.locationCity ?? r.locationState ?? "",
    date: r.startDate,
    duration: r.endDate,
    level: Array.isArray(r.skillLevels) ? r.skillLevels[0] : "All levels",
    price: Number(r.basePrice ?? 0),
    deposit_amount: r.depositAmount ?? r.deposit_amount,
    depositAmount: r.depositAmount ?? r.deposit_amount,
    total_spots: r.seatCapacity ?? 0,
    spots_available: Math.max(0, Number(r.seatCapacity ?? 0) - Number(r.bookedCount ?? 0)),
    image: r.coverImageUrl,
    includes: r.amenitiesIncluded ?? [],
    schedule: r.itinerary ?? [],
    published: r.status === "published",
    instructor_id: r.instructorId,
    created_at: r.createdAt ?? r.created_at,
    updated_at: r.updatedAt ?? r.updated_at,
    instructor: instructor
      ? {
          name: instructor.fullName ?? instructor.firstName ?? "Instructor",
          avatar: instructor.avatarUrl ?? "",
          bio: instructor.bio ?? "",
        }
      : undefined,
    ...r,
  };
}

export function toLegacyProperty(v: Record<string, unknown>) {
  return {
    id: v.id,
    owner_id: v.ownerId,
    property_name: v.name,
    headline: v.name,
    description: v.description,
    location: [v.city, v.state, v.country].filter(Boolean).join(", "),
    photos: v.galleryImages ?? (v.coverImageUrl ? [v.coverImageUrl] : []),
    sleeps: v.sleeps,
    max_quilters: v.maxCapacity,
    status: v.status,
    availability_calendar: v.availabilityCalendar ?? [],
    created_at: v.createdAt,
    updated_at: v.updatedAt,
    ...v,
  };
}

export function toLegacyProfile(user: {
  id: string;
  email: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  website?: string | null;
  propertyName?: string | null;
}) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    full_name: user.fullName ?? ([user.firstName, user.lastName].filter(Boolean).join(" ") || null),
    first_name: user.firstName,
    last_name: user.lastName,
    bio: user.bio,
    avatar_url: user.avatarUrl,
    phone: user.phone,
    website: user.website,
    property_name: user.propertyName,
  };
}

export function toLegacyBooking(b: Record<string, unknown>) {
  return {
    id: b.id,
    retreat_id: b.retreatId ?? b.retreat_id,
    user_id: b.userId ?? b.user_id,
    full_name: b.fullName ?? b.full_name,
    email: b.email,
    skill_level: b.skillLevel ?? b.skill_level,
    payment_status: b.paymentStatus ?? b.payment_status,
    manual_payment_status: b.manualPaymentStatus ?? b.manual_payment_status,
    deposit_amount: b.depositAmount ?? b.deposit_amount,
    full_amount: b.fullAmount ?? b.full_amount ?? b.amount,
    amount: b.amount ?? b.fullAmount ?? b.full_amount,
    payment_intent_id: b.paymentIntentId ?? b.payment_intent_id,
    booking_date: b.bookingDate ?? b.booking_date ?? b.createdAt ?? b.created_at,
    created_at: b.createdAt ?? b.created_at,
    refund_id: b.refundId ?? b.refund_id,
    refund_reason: b.refundReason ?? b.refund_reason,
    refund_date: b.refundDate ?? b.refund_date,
    price_variant: b.priceVariant ?? b.price_variant,
    add_ons: b.addOns ?? b.add_ons,
    status: b.status,
    ...b,
  };
}

/** Map backend retreat list item to UI card shape */
export function mapRetreatForCard(r: Record<string, unknown>) {
  const legacy = toLegacyRetreat(r);
  const instructor = (r.instructor ?? legacy.instructor) as Record<string, unknown> | undefined;
  return {
    id: legacy.id as number | string,
    title: String(legacy.title ?? ""),
    description: String(legacy.description ?? ""),
    location: String(legacy.location ?? ""),
    date: String(legacy.date ?? ""),
    duration: String(legacy.duration ?? ""),
    level: (legacy.level as "Beginner" | "Intermediate" | "Advanced" | "Any") ?? "Beginner",
    price: Number(legacy.price ?? 0),
    total_spots: Number(legacy.total_spots ?? 0),
    spots_available: Number(legacy.spots_available ?? 0),
    image: String(legacy.image ?? ""),
    includes: (legacy.includes as string[]) ?? [],
    schedule: (legacy.schedule as { day: string; activities: string }[]) ?? [],
    published: Boolean(legacy.published),
    instructor_id: String(legacy.instructor_id ?? r.instructorId ?? ""),
    created_at: String(r.createdAt ?? r.created_at ?? ""),
    location_images: (r.locationImages ?? r.location_images ?? null) as string[] | null,
    instructor: {
      name: String(instructor?.fullName ?? instructor?.full_name ?? instructor?.name ?? "Instructor"),
      avatar: String(instructor?.avatarUrl ?? instructor?.avatar_url ?? instructor?.avatar ?? ""),
      bio: String(instructor?.bio ?? ""),
      facebook: String(instructor?.facebookUrl ?? instructor?.facebook_url ?? ""),
      instagram: String(instructor?.instagramUrl ?? instructor?.instagram_url ?? ""),
      pinterest: String(instructor?.pinterestUrl ?? instructor?.pinterest_url ?? ""),
    },
  };
}

/** Map backend retreat to full detail page shape */
export function mapRetreatForDetail(r: Record<string, unknown>) {
  const card = mapRetreatForCard(r);
  return {
    ...card,
    deposit_amount: (r.depositAmount ?? r.deposit_amount ?? null) as number | null,
    deposit_refundable: (r.depositRefundable ?? r.deposit_refundable ?? null) as boolean | null,
    deposit_refund_days_before: (r.depositRefundDaysBefore ?? r.deposit_refund_days_before ?? null) as
      | number
      | null,
    payment_days_before_event: (r.paymentDaysBeforeEvent ?? r.payment_days_before_event ?? null) as number | null,
    full_payment_non_refundable: (r.fullPaymentNonRefundable ?? r.full_payment_non_refundable ?? null) as
      | boolean
      | null,
    discount_coupon: (r.discountCoupon ?? r.discount_coupon ?? null) as Record<string, unknown> | null,
    price_variants: (r.priceVariants ?? r.price_variants ?? null) as
      | { id: string; name: string; price: number; description?: string }[]
      | null,
    add_ons: (r.addOns ?? r.add_ons ?? null) as
      | { id: string; name: string; price: number; description?: string; required?: boolean }[]
      | null,
    content_cards: (r.contentCards ?? r.content_cards ?? null) as
      | { id: string; title: string; description: string; images: string[]; videos: string[]; order: number }[]
      | null,
    itinerary_blocks: (r.itineraryBlocks ?? r.itinerary_blocks ?? null) as
      | { id: string; type: string; title: string; description: string; day?: string; order?: number }[]
      | null,
    mode: (r.mode ?? null) as "IN_PERSON" | "ONLINE" | null,
    venue_id: (r.venueId ?? r.venue_id ?? null) as string | null,
    venue_usage_type: (r.venueUsageType ?? r.venue_usage_type ?? null) as "AT_LOCATION" | "OFFSITE" | null,
    seat_capacity: Number(r.seatCapacity ?? r.seat_capacity ?? 0),
  };
}

type LegacyRecord = Record<string, unknown>;

export function sumUnreadCount(conversations: ReadonlyArray<object>, userId?: string): number {
  return conversations.reduce((sum, item) => {
    const c = item as LegacyRecord;
    const explicit = c.unreadCount ?? c.unread_count;
    if (explicit != null) return sum + Number(explicit);
    if (userId) return sum + conversationUnreadCount(c, userId);
    return sum;
  }, 0);
}

export function getUserDisplayName(user: Record<string, unknown> | null | undefined): string {
  if (!user) return "Unknown";
  const full = user.fullName ?? user.full_name;
  if (full) return String(full);
  const parts = [user.firstName ?? user.first_name, user.lastName ?? user.last_name].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return "User";
}

export function getOtherParticipant(
  conversation: LegacyRecord,
  userId: string,
): LegacyRecord | undefined {
  const participants = (conversation.participants as Record<string, unknown>[]) ?? [];
  return participants.find((p) => {
    const pid = String(p.userId ?? (p.user as Record<string, unknown>)?.id ?? "");
    return pid && pid !== userId;
  });
}

/** Unread indicator for a conversation (0 or 1+ when exact count unavailable). */
export function conversationUnreadCount(
  conversation: LegacyRecord,
  userId?: string,
): number {
  const explicit = conversation.unreadCount ?? conversation.unread_count;
  if (explicit != null) return Number(explicit);

  const messages = (conversation.messages as Record<string, unknown>[]) ?? [];
  const lastMsg = messages[0];
  if (!lastMsg || !userId) return 0;

  const sender = (lastMsg.sender ?? {}) as Record<string, unknown>;
  const senderId = String(lastMsg.senderId ?? sender.id ?? "");
  if (senderId === userId) return 0;

  const participants = (conversation.participants as Record<string, unknown>[]) ?? [];
  const me = participants.find(
    (p) => String(p.userId ?? (p.user as Record<string, unknown>)?.id ?? "") === userId,
  );
  const lastReadAt = me?.lastReadAt as string | undefined;
  const createdAt = String(lastMsg.createdAt ?? lastMsg.created_at ?? "");
  if (!lastReadAt) return 1;
  return new Date(createdAt) > new Date(lastReadAt) ? 1 : 0;
}

const LEGACY_MESSAGE_TYPES: Record<string, string> = {
  TEXT: "retreat_question",
  RETREAT_QUESTION: "retreat_question",
  EVENT_REQUEST: "event_request",
  ATTENDEE_COMMUNICATION: "attendee_communication",
  VENUE_COMMUNICATION: "venue_communication",
  PAYMENT_REJECTION: "attendee_communication",
  BOOKING_CANCELLED: "attendee_communication",
  SYSTEM: "attendee_communication",
};

function mapLegacyMessageType(value: unknown): string {
  const key = String(value ?? "TEXT").toUpperCase();
  return LEGACY_MESSAGE_TYPES[key] ?? "retreat_question";
}

function mapLegacySenderRole(value: unknown): "instructor" | "location_owner" | "student" {
  const role = String(value ?? "student").toLowerCase();
  if (role === "instructor") return "instructor";
  if (role === "location_owner" || role === "venue_owner") return "location_owner";
  return "student";
}

/** Map backend message to legacy UI shape used by messaging pages. */
export function toLegacyMessage(
  m: Record<string, unknown> | null | undefined,
  opts?: { currentUserId?: string; lastReadAt?: string | null },
) {
  if (!m) return null;
  const sender = (m.sender ?? {}) as Record<string, unknown>;
  const senderId = String(m.senderId ?? sender.id ?? "");
  const createdAt = String(m.createdAt ?? m.created_at ?? new Date().toISOString());
  let read = senderId === opts?.currentUserId;
  if (!read && opts?.lastReadAt) {
    read = new Date(createdAt) <= new Date(opts.lastReadAt);
  }
  return {
    id: String(m.id),
    sender_id: senderId,
    sender_name: getUserDisplayName(sender),
    sender_role: mapLegacySenderRole(sender.role),
    receiver_id: m.receiverId ? String(m.receiverId) : undefined,
    receiver_name: m.receiverName ? String(m.receiverName) : undefined,
    content: String(m.body ?? m.content ?? ""),
    created_at: createdAt,
    read,
    message_type: mapLegacyMessageType(m.messageType ?? m.message_type) as
      | "event_request"
      | "retreat_question"
      | "attendee_communication"
      | "venue_communication",
    related_id: m.relatedId != null ? String(m.relatedId) : m.related_id != null ? String(m.related_id) : undefined,
  };
}

export function toLegacyEventRequest(er: Record<string, unknown>) {
  const venue = er.venue as Record<string, unknown> | undefined;
  const requestedBy = er.requestedBy as Record<string, unknown> | undefined;
  const retreat = er.retreat as Record<string, unknown> | undefined;
  return {
    id: String(er.id),
    event_title: String(retreat?.title ?? er.eventTitle ?? "Event Request"),
    instructor_name: getUserDisplayName(requestedBy),
    instructor_id: String(er.requestedById ?? ""),
    property_name: String(venue?.name ?? er.propertyName ?? ""),
    property_id: String(er.venueId ?? ""),
    property_owner_id: String(er.venueOwnerId ?? ""),
    start_date: er.startDate ? String(er.startDate).split("T")[0] : "",
    end_date: er.endDate ? String(er.endDate).split("T")[0] : "",
    expected_headcount: Number(er.expectedAttendees ?? 0),
    status: String(er.status ?? "PENDING").toLowerCase() as "pending" | "approved" | "declined",
    basic_schedule: {
      check_in: "Flexible",
      check_out: "Flexible",
      sewing_hours: "TBD",
      meals: [] as string[],
    },
    created_at: String(er.createdAt ?? ""),
  };
}

/** Map backend affiliate link to legacy shape used by venue dashboard */
export function toLegacyAffiliateLink(link: Record<string, unknown>) {
  const campaign = link.campaign as Record<string, unknown> | undefined;
  return {
    id: String(link.id),
    affiliate_id: link.affiliateId ?? link.affiliate_id,
    campaign_id: link.campaignId ?? link.campaign_id,
    link_code: link.linkCode ?? link.link_code,
    base_url: link.baseUrl ?? link.base_url,
    full_url: link.fullUrl ?? link.full_url,
    coupon_code: link.couponCode ?? link.coupon_code,
    clicks: Number(link.clicks ?? 0),
    created_at: link.createdAt ?? link.created_at,
    campaign: campaign
      ? {
          name: campaign.name,
          active_commission_value: campaign.activeCommissionValue ?? campaign.active_commission_value,
          active_commission_type: campaign.activeCommissionType ?? campaign.active_commission_type,
          active_commission_base: campaign.activeCommissionBase ?? campaign.active_commission_base,
        }
      : undefined,
  };
}

/** Convert legacy retreat form payload to backend API body */
export function fromLegacyRetreatPayload(data: Record<string, unknown>): Record<string, unknown> {
  const published = Boolean(data.published);
  return {
    title: data.title,
    description: data.description,
    locationCity: data.location,
    location: data.location,
    startDate: data.date,
    endDate: data.duration,
    date: data.date,
    duration: data.duration,
    skillLevels: data.level ? [data.level] : [],
    level: data.level,
    basePrice: data.price,
    price: data.price,
    seatCapacity: data.total_spots ?? data.seat_capacity,
    total_spots: data.total_spots,
    seat_capacity: data.seat_capacity,
    sleep_capacity: data.sleep_capacity,
    coverImageUrl: data.image,
    image: data.image,
    amenitiesIncluded: data.includes,
    includes: data.includes,
    itinerary: data.schedule,
    schedule: data.schedule,
    itineraryBlocks: data.itinerary_blocks,
    itinerary_blocks: data.itinerary_blocks,
    status: published ? "published" : "draft",
    published,
    venueFees: data.venue_fees,
    venue_fees: data.venue_fees,
    foodBudget: data.food_budget,
    food_budget: data.food_budget,
    locationImages: data.location_images,
    location_images: data.location_images,
    discountCoupon: data.discount_coupon,
    discount_coupon: data.discount_coupon,
    priceVariants: data.price_variants,
    price_variants: data.price_variants,
    addOns: data.add_ons,
    add_ons: data.add_ons,
    contentCards: data.content_cards,
    content_cards: data.content_cards,
    mode: data.mode,
    videoProvider: data.video_provider,
    video_provider: data.video_provider,
    meetingUrl: data.meeting_url,
    meeting_url: data.meeting_url,
    venueId: data.venue_id,
    venue_id: data.venue_id,
    venueUsageType: data.venue_usage_type,
    venue_usage_type: data.venue_usage_type,
    depositAmount: data.deposit_amount,
    deposit_amount: data.deposit_amount,
    depositRefundable: data.deposit_refundable,
    deposit_refundable: data.deposit_refundable,
    depositRefundDaysBefore: data.deposit_refund_days_before,
    deposit_refund_days_before: data.deposit_refund_days_before,
    paymentDaysBeforeEvent: data.payment_days_before_event,
    payment_days_before_event: data.payment_days_before_event,
    fullPaymentNonRefundable: data.full_payment_non_refundable,
    full_payment_non_refundable: data.full_payment_non_refundable,
  };
}

/** Map backend user record to legacy profile shape (includes admin-only fields) */
export function mapLegacyProfile(u: Record<string, unknown>) {
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    full_name:
      u.fullName ??
      u.full_name ??
      ([u.firstName, u.last_name, u.lastName].filter(Boolean).join(" ") || null),
    first_name: u.firstName ?? u.first_name,
    last_name: u.lastName ?? u.last_name,
    bio: u.bio,
    avatar_url: u.avatarUrl ?? u.avatar_url,
    discount: u.discount,
    first_event_free_eligible: u.firstEventFreeEligible ?? u.first_event_free_eligible,
    first_event_free_used: u.firstEventFreeUsed ?? u.first_event_free_used,
    referred_by: u.referredBy ?? u.referred_by,
    created_at: u.createdAt ?? u.created_at,
  };
}

/** Map backend venue room to VenueRoomManager shape */
export function mapVenueRoomFromApi(room: Record<string, unknown>) {
  let images: string[] = [];
  const imageUrl = room.imageUrl ?? room.image_url;
  if (imageUrl && typeof imageUrl === "string") {
    try {
      const parsed = JSON.parse(imageUrl);
      images = Array.isArray(parsed) ? parsed : [imageUrl];
    } catch {
      images = [imageUrl];
    }
  }

  return {
    id: room.id ? String(room.id) : undefined,
    name: String(room.name ?? ""),
    image_url: images[0],
    images,
    description: String(room.description ?? ""),
    bed_count: Number(room.bedCount ?? room.bed_count ?? 0),
    beds: ((room.beds as Record<string, unknown>[]) ?? []).map((bed) => ({
      id: bed.id ? String(bed.id) : undefined,
      title: String(bed.title ?? ""),
      image_url: (bed.imageUrl ?? bed.image_url) as string | undefined,
      sort_order: Number(bed.sortOrder ?? bed.sort_order ?? 0),
    })),
  };
}
