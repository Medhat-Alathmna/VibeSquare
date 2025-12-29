// Subscription Models

export type SubscriptionTier = 'free' | 'pro';
export type SubscriptionStatus = 'active' | 'canceled' | null;

export interface SubscriptionData {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  quota: {
    limit: number;
    used: number;
    remaining: number;
  };
  upgrade?: {
    available: boolean;
    tier: string;
    limit: number;
    price: string;
  };
}

export interface SubscriptionResponse {
  success: boolean;
  data: SubscriptionData;
}

// Checkout
export interface CheckoutRequest {
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResponse {
  success: boolean;
  data: {
    checkoutUrl: string;
  };
}

// Customer Portal
export interface PortalRequest {
  returnUrl: string;
}

export interface PortalResponse {
  success: boolean;
  data: {
    portalUrl: string;
  };
}

// Subscription Actions
export interface SubscriptionActionResponse {
  success: boolean;
  data: {
    message: string;
    cancelAt?: string;
    status?: string;
  };
}
