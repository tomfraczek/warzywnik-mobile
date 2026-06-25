import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import {
  REVENUECAT_ENTITLEMENT_PREMIUM,
  REVENUECAT_PACKAGE_ANNUAL,
  REVENUECAT_PACKAGE_MONTHLY,
} from './revenueCat.constants';

let isConfigured = false;
let currentUserId: string | null = null;

function getApiKey(): string | undefined {
  if (Platform.OS === 'android') {
    return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || undefined;
  }
  if (Platform.OS === 'ios') {
    // iOS key not yet configured; return undefined to skip silently
    return (process.env as Record<string, string | undefined>)['EXPO_PUBLIC_REVENUECAT_IOS_API_KEY'] || undefined;
  }
  return undefined;
}

export async function configureRevenueCat(userId: string): Promise<void> {
  if (!userId) return;

  const apiKey = getApiKey();
  if (!apiKey) return;

  if (!isConfigured) {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }
    Purchases.configure({ apiKey });
    isConfigured = true;
  }

  if (currentUserId !== userId) {
    await Purchases.logIn(userId);
    currentUserId = userId;
  }
}

export async function logOutRevenueCat(): Promise<void> {
  if (!isConfigured || !currentUserId) return;
  try {
    await Purchases.logOut();
  } catch {
    // logOut throws if the user is already anonymous; ignore
  }
  currentUserId = null;
}

export async function getRevenueCatOfferings(): Promise<PurchasesOffering | null> {
  if (!isConfigured || !currentUserId) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch {
    return null;
  }
}

export async function purchaseRevenueCatPackage(
  packageToPurchase: PurchasesPackage,
): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
  return customerInfo;
}

export async function restoreRevenueCatPurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

export async function getRevenueCatCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo();
}

export function hasRevenueCatPremium(customerInfo: CustomerInfo): boolean {
  return !!customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_PREMIUM];
}

export function isRevenueCatUserCancellation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as Record<string, unknown>;
  return (
    e['code'] === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR ||
    Boolean(e['userCancelled'])
  );
}

export function getPremiumPackages(offering: PurchasesOffering | null): {
  monthlyPackage: PurchasesPackage | null;
  annualPackage: PurchasesPackage | null;
} {
  if (!offering) return { monthlyPackage: null, annualPackage: null };

  const monthlyPackage =
    offering.availablePackages.find(
      (pkg) => pkg.identifier === REVENUECAT_PACKAGE_MONTHLY,
    ) ??
    offering.monthly ??
    null;

  const annualPackage =
    offering.availablePackages.find(
      (pkg) => pkg.identifier === REVENUECAT_PACKAGE_ANNUAL,
    ) ??
    offering.annual ??
    null;

  return { monthlyPackage, annualPackage };
}
