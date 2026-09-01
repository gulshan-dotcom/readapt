import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "../../components/nav/MainNavigation";

type Props = NativeStackScreenProps<RootStackParamList, 'Subscription'>;
import useAuth from "../../hooks/useAuth";
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Svg, { Polyline, Line } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import pallete from '../../lib/Colors';
import { useUser } from '../../hooks/useUser';
import { useToast } from '../../hooks/useToast';
import { api } from '../../lib/api';

const CARD_WIDTH = 290;
const CARD_GAP = 16;
const NEXT_API_URL = 'https://redapt-admin-git-main-gulshan-dotcoms-projects.vercel.app/api/userapi/user';

const PLANS = [
  {
    id: 'basic',
    index: 1,
    name: 'Basic',
    price: '₹19',
    numericPrice: 19,
    duration: '30 Days Validity',
    featured: false,
    features: ['Eligible content access', 'Post comments support'],
    buttonText: 'Get Basic',
  },
  {
    id: 'standard',
    index: 2,
    name: 'Standard',
    price: '₹49',
    numericPrice: 49,
    duration: '30 Days Validity',
    featured: true,
    features: [
      'Eligible content access',
      'Audio Transcription',
      'Download Support',
    ],
    buttonText: 'Get Standard',
  },
  {
    id: 'pro',
    index: 3,
    name: 'Pro',
    price: '₹99',
    numericPrice: 99,
    duration: '40 Days Validity',
    featured: false,
    features: [
      'All content access',
      'Background Play',
      'Extended Month Plan',
    ],
    buttonText: 'Get Pro',
  },
];

const COMPARISON = [
  { feature: 'Content Access', basic: 'Eligible', standard: 'Eligible', pro: 'All Access' },
  { feature: 'Post Comment', basic: true, standard: true, pro: true },
  { feature: 'Download Support', basic: false, standard: true, pro: true },
  { feature: 'Audio Transcription', basic: false, standard: true, pro: true },
  { feature: 'Background Play', basic: false, standard: false, pro: true },
  { feature: 'Duration', basic: '30 Days', standard: '30 Days', pro: '40 Days' },
];

const Subscription = ({ route, navigation }: Props) => {
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [accessToken] = useAuth();
  const { user, reload } = useUser()
  const { showToast } = useToast()

  useEffect(() => {
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  const handleDeepLink = (event: { url: string }) => {
    WebBrowser.dismissBrowser();

    const data = Linking.parse(event.url);
    if (data.path === 'payment-callback') {
      const razorpayPaymentId = data.queryParams?.razorpay_payment_id;
      const razorpayStatus = data.queryParams?.razorpay_payment_link_status;

      if (razorpayStatus === 'paid' || razorpayPaymentId) {
        Alert.alert('Payment Successful', 'Your subscription is now active!');
      } else {
        Alert.alert('Payment Status', 'Payment completed or pending status check.');
      }
    }
  };

  const handlePayment = async (plan: typeof PLANS[0]) => {
    try {
      if (!user) {
        showToast({ title: 'Please try again later.', time: 3000 });
        return;
      }

      setLoadingPlanId(plan.id);

      // 1. Get Razorpay payment link from Next.js backend
      const response = await fetch(`${NEXT_API_URL}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`, },
        body: JSON.stringify({
          amount: plan.numericPrice,
          planId: plan.index,
          user,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || 'Failed to create payment link');

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        Linking.createURL('payment-callback')
      );

      if (result.type === 'cancel' || result.type === 'dismiss') {
        const res = api.post("/payment/fail")
        showToast({ title: 'Payment Cancelled', });
      }
    } catch (error: any) {
      showToast({ title: error.message || 'Something went wrong' });
    } finally {
      reload()
      setLoadingPlanId(null);
    }
  };

  const renderCheck = (value: boolean | string, highlight = false) => {
    if (typeof value === 'string') {
      return (
        <Text style={[styles.compValue, highlight && { color: '#4ade80', fontWeight: '700' }]}>
          {value}
        </Text>
      );
    }

    return value ? (
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3">
        <Polyline points="20 6 9 17 4 12" />
      </Svg>
    ) : (
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fb7185" strokeWidth="3">
        <Line x1="18" y1="6" x2="6" y2="18" />
        <Line x1="6" y1="6" x2="18" y2="18" />
      </Svg>
    );
  };

  const renderPlan = ({ item }: { item: (typeof PLANS)[0] }) =>  (
    <Pressable
      style={({ pressed }) => [
        styles.planCard,
        item.featured && styles.planCardFeatured,
        pressed && { transform: [{ scale: 0.99 }] },
      ]}
    >
      {item.featured && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>Recommended</Text>
        </View>
      )}

      <View>
        <Text style={styles.planName}>{item.name}</Text>

        <View style={styles.planPriceRow}>
          <Text style={styles.planPrice}>{item.price}</Text>
          <Text style={styles.planPriceUnit}>/mo</Text>
        </View>

        <Text style={styles.planDuration}>{item.duration}</Text>

        <View style={styles.featuresList}>
          {item.features.map((feat, idx) => (
            <View key={idx} style={styles.featureItem}>
              <Svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke={item.featured ? '#4ade80' : pallete.accent}
                strokeWidth="3"
              >
                <Polyline points="20 6 9 17 4 12" />
              </Svg>
              <Text style={styles.featureText}>{feat}</Text>
            </View>
          ))}
        </View>
      </View>

      <Pressable
        disabled={loadingPlanId !== null}
        style={({ pressed }) => [
          styles.actionBtn,
          item.featured && styles.actionBtnFeatured,
          pressed && { transform: [{ scale: 0.97 }] },
        ]}
        onPress={() => handlePayment(item)}
      >
        {loadingPlanId === item.id ? (
          <ActivityIndicator color={item.featured ? '#0b0b0b' : '#fff'} />
        ) : (
          <Text
            style={[
              styles.actionBtnText,
              item.featured && styles.actionBtnTextFeatured,
            ]}
          >
            {user?.subscription?.plan === item.index ? 'Current Plan' : item.buttonText}
          </Text>
        )}
      </Pressable>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <FlatList
          data={PLANS}
          renderItem={renderPlan}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.plansContainer}
          snapToInterval={CARD_WIDTH + CARD_GAP}
          decelerationRate="fast"
          snapToAlignment="center"
        />

        <View style={styles.compSection}>
          <Text style={styles.compTitle}>Compare Benefits</Text>
          <View style={styles.compTable}>
            <View style={styles.compHeaderRow}>
              <Text style={[styles.compHeaderCell, { flex: 1.4, textAlign: 'left' }]}>
                Features
              </Text>
              <Text style={styles.compHeaderCell}>Basic</Text>
              <Text style={[styles.compHeaderCell, { color: '#4ade80' }]}>Std</Text>
              <Text style={[styles.compHeaderCell, { color: '#fbbf24' }]}>Pro</Text>
            </View>

            {COMPARISON.map((row, idx) => (
              <View
                key={idx}
                style={[
                  styles.compRow,
                  idx === COMPARISON.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <Text style={[styles.featureLabel, { flex: 1.4 }]}>
                  {row.feature}
                </Text>
                <View style={styles.compCell}>{renderCheck(row.basic)}</View>
                <View style={styles.compCell}>{renderCheck(row.standard, true)}</View>
                <View style={styles.compCell}>{renderCheck(row.pro)}</View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: pallete.bgmain || '#090314',
  },
  scrollContent: {
    paddingTop: 94,
    paddingBottom: 60,
  },
  plansContainer: {
    paddingHorizontal: 24,
    paddingTop: 35,
    paddingBottom: 32,
    gap: CARD_GAP,
  },
  planCard: {
    width: CARD_WIDTH,
    backgroundColor: pallete.bgcard || 'rgba(20,20,20,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 24,
    justifyContent: 'space-between',
  },
  planCardFeatured: {
    borderWidth: 2,
    borderColor: '#00A36C',
    backgroundColor: 'rgba(20,20,20,0.85)',
    shadowColor: '#00A36C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#00A36C',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    shadowColor: '#00A36C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  recommendedText: {
    color: '#050505',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  planPriceUnit: {
    fontSize: 13,
    color: pallete.textgray,
    fontWeight: '400',
    marginLeft: 4,
  },
  planDuration: {
    fontSize: 12,
    color: '#fbbf24',
    fontWeight: '600',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featuresList: {
    gap: 12,
    marginBottom: 28,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    color: '#e5e7eb',
    flex: 1,
  },
  actionBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  actionBtnFeatured: {
    backgroundColor: '#00A36C',
    shadowColor: '#00A36C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 4,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  actionBtnTextFeatured: {
    color: '#0b0b0b',
  },
  compSection: {
    paddingHorizontal: 24,
    marginTop: 8,
  },
  compTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: pallete.textgray,
    marginBottom: 16,
  },
  compTable: {
    backgroundColor: pallete.bgcard || 'rgba(20,20,20,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  compHeaderRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.02)',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  compHeaderCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  featureLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#e5e7eb',
  },
  compCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compValue: {
    fontSize: 12,
    color: '#e5e7eb',
    textAlign: 'center',
  },
});

export default Subscription;