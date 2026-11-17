import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Alert,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QrCode, CheckCircle2, Clock, Bot, CheckCircle } from 'lucide-react-native';
import { subscriptionApi, SubscriptionProduct, SubscriptionPlan, Payment, resolveAssetUrl } from '@/api/subscription';
import { useColors, space, radius, typography } from '@/theme';
import { GlassCard, AppButton, Badge } from '@/components';
import { useCustomAlert } from '@/context/AlertContext';
import { useAuth } from '@/context/AuthContext';
import { formatMP } from '@/utils/format';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'Subscription'>;

const POLL_MS = 4000;

export default function SubscriptionScreen({ navigation }: Props) {
  const c = useColors();
  const alert = useCustomAlert();
  const { userType } = useAuth();

  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [now, setNow] = useState(Date.now());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isTrader = userType === 'trader';

  const load = useCallback(async () => {
    if (isTrader) { setLoading(false); return; }
    try {
      const res = await subscriptionApi.getPlans();
      const list = res.data ?? [];
      setProducts(list);
      if (list.length > 0) {
        setSelectedProductId((prev) => prev ?? list[0].id);
      }
    } catch (e: any) {
      alert.showAlert({ title: 'Gagal memuat', message: e?.message ?? 'Tidak dapat memuat katalog.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [isTrader, alert]);

  useFocusEffect(useCallback(() => {
    // Reset ke katalog tiap kali layar difokuskan.
    stopPolling();
    setPayment(null);
    load();
    return () => stopPolling();
  }, [load]));

  // Ticker untuk hitung mundur masa berlaku QR.
  useEffect(() => {
    if (!payment || payment.status !== 'pending') return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [payment]);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = (paymentId: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await subscriptionApi.getPayment(paymentId);
        const p = res.data;
        setPayment(p);
        if (p.status !== 'pending') stopPolling();
      } catch {
        // diam saja — coba lagi di tick berikutnya
      }
    }, POLL_MS);
  };

  const doCheckout = async (plan: SubscriptionPlan) => {
    if (checkingOut) return;
    setCheckingOut(true);
    try {
      const res = await subscriptionApi.checkout(plan.id);
      const p = res.data;
      setPayment(p);
      setNow(Date.now());
      if (p.status === 'pending') startPolling(p.id);
    } catch (e: any) {
      alert.showAlert({ title: 'Checkout gagal', message: e?.message ?? 'Tidak dapat membuat pembayaran.', type: 'error' });
    } finally {
      setCheckingOut(false);
    }
  };

  // Poin 4: bila produk sudah aktif, konfirmasi bahwa pembayaran = PERPANJANG masa,
  // bukan langganan baru/duplikat.
  const handleCheckout = (plan: SubscriptionPlan, product: SubscriptionProduct | null) => {
    if (product?.is_subscribed) {
      const days = product.days_remaining ?? 0;
      Alert.alert(
        'Perpanjang Langganan',
        `Anda sudah berlangganan ${product.name} (aktif ${days} hari lagi). Pembayaran ini akan MENAMBAH masa langganan, bukan menggandakan. Lanjutkan?`,
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Perpanjang', onPress: () => doCheckout(plan) },
        ],
      );
      return;
    }
    doCheckout(plan);
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId) ?? null;

  // ── Phase 2: pembayaran (QR + polling) ──
  if (payment) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.bg.primary }]} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => { stopPolling(); setPayment(null); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[typography.body, { color: c.accent.purple, fontFamily: 'DMSans-SemiBold' }]}>‹ Kembali</Text>
            </TouchableOpacity>
          </View>

          <Text style={[typography.h2, { color: c.text.primary, fontFamily: 'Manrope-ExtraBold', marginBottom: space.sm }]}>
            Pembayaran QRIS
          </Text>
          <Text style={[typography.caption, { color: c.text.secondary, marginBottom: space.xl }]}>
            Order <Text style={{ fontFamily: 'DMSans-Medium' }}>{payment.order_id}</Text>
          </Text>

          <GlassCard elevation={3} style={{ alignItems: 'center' }}>
            <Text style={[typography.caption, { color: c.text.secondary }]}>Total</Text>
            <Text style={{ fontSize: 28, fontFamily: 'Manrope-ExtraBold', color: c.accent.gold, marginBottom: space.lg }}>
              Rp {formatMP(payment.amount_idr)}
            </Text>

            {payment.status === 'pending' && (
              <>
                <QrBox payment={payment} />
                <Countdown expiresAt={payment.expires_at} now={now} color={c.text.secondary} />
                <Text style={[typography.caption, { color: c.text.muted ?? c.text.secondary, textAlign: 'center', marginTop: space.md }]}>
                  Scan QR di aplikasi pembayaran Anda. Status akan diperbarui otomatis.
                </Text>
              </>
            )}

            {payment.status === 'paid' && (
              <View style={{ alignItems: 'center', paddingVertical: space.lg }}>
                <CheckCircle2 size={56} color={c.semantic.positive} strokeWidth={1.5} />
                <Text style={[typography.h3, { color: c.semantic.positive, marginTop: space.md, fontFamily: 'Manrope-Bold' }]}>
                  Pembayaran Berhasil
                </Text>
                <Text style={[typography.caption, { color: c.text.secondary, textAlign: 'center', marginTop: space.xs }]}>
                  Langganan Anda telah aktif.
                </Text>
              </View>
            )}

            {payment.status === 'expired' && (
              <View style={{ alignItems: 'center', paddingVertical: space.lg }}>
                <Clock size={56} color={c.semantic.warning} strokeWidth={1.5} />
                <Text style={[typography.h3, { color: c.semantic.warning, marginTop: space.md, fontFamily: 'Manrope-Bold' }]}>
                  Kadaluwarsa
                </Text>
                <Text style={[typography.caption, { color: c.text.secondary, textAlign: 'center', marginTop: space.xs }]}>
                  Waktu pembayaran habis. Silakan buat ulang.
                </Text>
              </View>
            )}

            {payment.status === 'failed' && (
              <View style={{ alignItems: 'center', paddingVertical: space.lg }}>
                <Text style={[typography.h3, { color: c.semantic.negative, fontFamily: 'Manrope-Bold' }]}>Gagal</Text>
                <Text style={[typography.caption, { color: c.text.secondary, textAlign: 'center', marginTop: space.xs }]}>
                  Pembayaran gagal. Silakan coba lagi.
                </Text>
              </View>
            )}
          </GlassCard>

          {payment.status === 'pending' && (
            <View style={{ marginTop: space.lg }}>
              <AppButton title="Cek Status" variant="ghost" onPress={() => subscriptionApi.getPayment(payment.id).then((r) => { setPayment(r.data); if (r.data.status !== 'pending') stopPolling(); }).catch(() => {})} />
            </View>
          )}

          {(payment.status === 'expired' || payment.status === 'failed' || payment.status === 'paid') && (
            <View style={{ marginTop: space.lg }}>
              <AppButton title="Kembali ke Katalog" variant="primary" onPress={() => { stopPolling(); setPayment(null); }} />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Phase 1: etalase (grid kartu) + pilih plan ──
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg.primary }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[typography.body, { color: c.accent.purple, fontFamily: 'DMSans-SemiBold' }]}>‹ Kembali</Text>
          </TouchableOpacity>
          {!isTrader && (
            <TouchableOpacity onPress={() => navigation.navigate('MySubscriptions')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[typography.body, { color: c.accent.gold, fontFamily: 'DMSans-SemiBold' }]}>Langganan Saya</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[typography.h2, { color: c.text.primary, fontFamily: 'Manrope-ExtraBold', marginBottom: space.sm }]}>
          Etalase Bot
        </Text>
        <Text style={[typography.caption, { color: c.text.secondary, marginBottom: space.xl }]}>
          Pilih bot dan durasi langganan. Pembayaran via QRIS.
        </Text>

        {isTrader && (
          <GlassCard elevation={2}>
            <Text style={[typography.body, { color: c.text.secondary, textAlign: 'center' }]}>
              Fitur langganan hanya tersedia untuk akun pengguna biasa.
            </Text>
          </GlassCard>
        )}

        {!isTrader && loading && (
          <View style={{ paddingVertical: space['3xl'], alignItems: 'center' }}>
            <ActivityIndicator color={c.accent.purple} />
          </View>
        )}

        {!isTrader && !loading && products.length === 0 && (
          <GlassCard elevation={2}>
            <Text style={[typography.body, { color: c.text.secondary, textAlign: 'center' }]}>
              Belum ada produk yang tersedia.
            </Text>
          </GlassCard>
        )}

        {!isTrader && !loading && products.length > 0 && (
          <>
            {/* Grid 2 kolom kartu bot */}
            <View style={styles.grid}>
              {products.map((p) => {
                const active = p.id === selectedProductId;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setSelectedProductId(p.id)}
                    activeOpacity={0.85}
                    style={styles.gridItem}
                  >
                    <View
                      style={[
                        styles.productCard,
                        {
                          backgroundColor: c.glass.g2,
                          borderColor: active ? c.accent.purple : c.glass.border,
                          borderWidth: active ? 2 : 1,
                        },
                      ]}
                    >
                      <View style={styles.iconWrap}>
                        {resolveAssetUrl(p.icon_path, p.icon_url) ? (
                          <ExpoImage
                            source={{ uri: resolveAssetUrl(p.icon_path, p.icon_url)! }}
                            style={styles.iconImg}
                            contentFit="cover"
                          />
                        ) : (
                          <Bot size={30} color={c.accent.purple} strokeWidth={1.6} />
                        )}
                      </View>
                      <Text style={[typography.bodyBold, { color: c.text.primary, fontFamily: 'DMSans-Bold', marginTop: space.sm }]} numberOfLines={1}>
                        {p.name}
                      </Text>
                      {p.is_subscribed && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 }}>
                          <CheckCircle size={12} color={c.semantic.positive} />
                          <Text style={{ fontSize: 11, color: c.semantic.positive, fontFamily: 'DMSans-SemiBold' }}>
                            Aktif · {p.days_remaining ?? 0} hari
                          </Text>
                        </View>
                      )}
                      {p.starting_price_idr != null && (
                        <Text style={[typography.caption, { color: c.text.secondary, marginTop: 2 }]} numberOfLines={1}>
                          Mulai dari <Text style={{ color: c.accent.gold, fontFamily: 'DMSans-Bold' }}>Rp {formatMP(p.starting_price_idr)}</Text>
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedProduct?.description ? (
              <Text style={[typography.caption, { color: c.text.secondary, marginTop: space.lg, marginBottom: space.lg }]}>
                {selectedProduct.description}
              </Text>
            ) : (
              <View style={{ height: space.lg }} />
            )}

            {selectedProduct?.plans.map((plan) => (
              <GlassCard key={plan.id} elevation={2} style={{ marginBottom: space.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.h3, { color: c.text.primary, fontFamily: 'Manrope-Bold' }]}>{plan.name}</Text>
                    <Text style={[typography.caption, { color: c.text.secondary, marginTop: 2 }]}>
                      {plan.duration_days} hari
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 18, fontFamily: 'Manrope-ExtraBold', color: c.accent.gold }}>
                      Rp {formatMP(plan.price_idr)}
                    </Text>
                  </View>
                </View>
                <View style={{ marginTop: space.md }}>
                  <AppButton
                    title={checkingOut ? 'Memproses…' : (selectedProduct?.is_subscribed ? 'Perpanjang' : 'Pilih & Bayar')}
                    variant={selectedProduct?.is_subscribed ? 'secondary' : 'primary'}
                    loading={checkingOut}
                    onPress={() => handleCheckout(plan, selectedProduct)}
                  />
                </View>
              </GlassCard>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Kotak QR: render QR image bila tersedia (gateway asli); selain itu tampilkan
// placeholder bergaya untuk qr_string mentah (FakeGateway di dev/tes).
function QrBox({ payment }: { payment: Payment }) {
  const c = useColors();
  if (payment.qr_image_url) {
    return (
      <View style={styles.qrWrap}>
        <Image source={{ uri: payment.qr_image_url }} style={styles.qrImage} resizeMode="contain" />
      </View>
    );
  }
  return (
    <View style={[styles.qrWrap, { backgroundColor: '#fff' }]}>
      <QrCode size={140} color={c.bg.primary} strokeWidth={1.2} />
      <Text style={{ fontSize: 9, color: c.bg.primary, marginTop: space.sm, textAlign: 'center', paddingHorizontal: 8 }} numberOfLines={2}>
        {payment.qr_string ?? 'QR tidak tersedia'}
      </Text>
    </View>
  );
}

function Countdown({ expiresAt, now, color }: { expiresAt: string | null; now: number; color: string }) {
  if (!expiresAt) return null;
  const end = new Date(expiresAt).getTime();
  const remain = Math.max(0, Math.floor((end - now) / 1000));
  const mm = Math.floor(remain / 60);
  const ss = remain % 60;
  return (
    <Text style={[typography.caption, { color, marginTop: space.md }]}>
      Berlaku {mm}:{ss.toString().padStart(2, '0')}
    </Text>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: space['2xl'], paddingBottom: space['4xl'] },
  headerRow: { paddingVertical: space.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: space.sm,
  },
  gridItem: {
    width: '48%',
    marginBottom: space.md,
  },
  productCard: {
    borderRadius: radius.lg,
    padding: space.lg,
    alignItems: 'center',
    minHeight: 150,
    justifyContent: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: 'rgba(139,92,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconImg: { width: 56, height: 56 },
  qrWrap: {
    borderRadius: radius.md,
    padding: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 180,
    minHeight: 180,
  },
  qrImage: { width: 180, height: 180 },
});
