import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Alert,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { QrCode, CheckCircle2, Clock, Bot, Upload, ShieldCheck, XCircle } from 'lucide-react-native';
import { subscriptionApi, SubscriptionProduct, SubscriptionPlan, Payment, resolveAssetUrl } from '@/api/subscription';
import { useColors, space, radius, typography } from '@/theme';
import { GlassCard, AppButton } from '@/components';
import { useCustomAlert } from '@/context/AlertContext';
import { useAuth } from '@/context/AuthContext';
import { formatMP } from '@/utils/format';
import type { RootStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'Subscription'>;

export default function SubscriptionScreen({ navigation }: Props) {
  const c = useColors();
  const alert = useCustomAlert();
  const { userType } = useAuth();

  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
    setPayment(null);
    setProofUri(null);
    load();
  }, [load]));

  const doCheckout = async (plan: SubscriptionPlan) => {
    if (checkingOut) return;
    setCheckingOut(true);
    try {
      const res = await subscriptionApi.checkout(plan.id);
      setPayment(res.data);
      setProofUri(null);
    } catch (e: any) {
      alert.showAlert({ title: 'Checkout gagal', message: e?.message ?? 'Tidak dapat membuat pembayaran.', type: 'error' });
    } finally {
      setCheckingOut(false);
    }
  };

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

  const refreshStatus = async () => {
    if (!payment) return;
    setRefreshing(true);
    try {
      const res = await subscriptionApi.getPayment(payment.id);
      setPayment(res.data);
    } catch { /* diam */ } finally {
      setRefreshing(false);
    }
  };

  const pickProof = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert.showAlert({ title: 'Izin ditolak', message: 'Izinkan akses galeri foto.', type: 'error' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setProofUri(result.assets[0].uri);
    }
  };

  const submitProof = async () => {
    if (!payment || !proofUri || uploading) return;
    setUploading(true);
    try {
      const res = await subscriptionApi.uploadProof(payment.id, {
        uri: proofUri,
        name: 'proof.jpg',
        type: 'image/jpeg',
      });
      setPayment(res.data);
      setProofUri(null);
      alert.showAlert({ title: 'Terkirim', message: 'Bukti transfer diunggah. Menunggu verifikasi admin.', type: 'success' });
    } catch (e: any) {
      alert.showAlert({ title: 'Upload gagal', message: e?.message ?? 'Tidak dapat mengunggah bukti.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId) ?? null;

  // ── Phase 2: pembayaran (QRIS statis + upload bukti) ──
  if (payment) {
    const canUpload = payment.status === 'pending' || payment.status === 'failed';

    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.bg.primary }]} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => { setPayment(null); setProofUri(null); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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

            {(payment.status === 'pending' || payment.status === 'awaiting_verification') && (
              <>
                <QrBox qrisPath={payment.qris_image_url} />
                {payment.status === 'pending' && (
                  <Text style={[typography.caption, { color: c.text.muted ?? c.text.secondary, textAlign: 'center', marginTop: space.md }]}>
                    Scan/transfer ke QRIS di atas (a/n PT Metavest), lalu unggah bukti transfer di bawah.
                  </Text>
                )}
                {payment.status === 'awaiting_verification' && (
                  <Text style={[typography.caption, { color: c.semantic.warning, textAlign: 'center', marginTop: space.md }]}>
                    Bukti transfer sudah diunggah. Menunggu verifikasi admin.
                  </Text>
                )}
              </>
            )}

            {payment.status === 'awaiting_verification' && (
              <View style={{ alignItems: 'center', marginTop: space.md }}>
                <Clock size={40} color={c.semantic.warning} strokeWidth={1.5} />
              </View>
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

            {payment.status === 'failed' && (
              <View style={{ alignItems: 'center', paddingVertical: space.md }}>
                <XCircle size={56} color={c.semantic.negative} strokeWidth={1.5} />
                <Text style={[typography.h3, { color: c.semantic.negative, marginTop: space.md, fontFamily: 'Manrope-Bold' }]}>
                  Pembayaran Ditolak
                </Text>
                {!!payment.reject_reason && (
                  <Text style={[typography.caption, { color: c.text.secondary, textAlign: 'center', marginTop: space.xs }]}>
                    Alasan: {payment.reject_reason}
                  </Text>
                )}
                <Text style={[typography.caption, { color: c.text.secondary, textAlign: 'center', marginTop: space.xs }]}>
                  Silakan unggah ulang bukti transfer yang benar.
                </Text>
              </View>
            )}
          </GlassCard>

          {/* Upload bukti transfer */}
          {canUpload && (
            <GlassCard elevation={2} style={{ marginTop: space.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: space.sm }}>
                <Upload size={18} color={c.accent.purple} />
                <Text style={[typography.bodyBold, { color: c.text.primary, fontFamily: 'DMSans-Bold' }]}>
                  Unggah Bukti Transfer
                </Text>
              </View>

              {proofUri ? (
                <Image source={{ uri: proofUri }} style={styles.proofPreview} resizeMode="contain" />
              ) : (
                <Text style={[typography.caption, { color: c.text.secondary, marginBottom: space.md }]}>
                  Pilih screenshot/foto bukti transfer dari galeri.
                </Text>
              )}

              <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
                <View style={{ flex: 1 }}>
                  <AppButton title={proofUri ? 'Ganti Foto' : 'Pilih Foto'} variant="secondary" onPress={pickProof} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppButton
                    title={uploading ? 'Mengunggah…' : 'Kirim Bukti'}
                    variant="primary"
                    loading={uploading}
                    disabled={!proofUri || uploading}
                    onPress={submitProof}
                  />
                </View>
              </View>
            </GlassCard>
          )}

          {payment.status === 'awaiting_verification' && (
            <View style={{ marginTop: space.lg }}>
              <AppButton title={refreshing ? 'Memeriksa…' : 'Cek Status'} variant="ghost" loading={refreshing} onPress={refreshStatus} />
              <View style={{ height: space.sm }} />
              <AppButton title="Kembali ke Katalog" variant="secondary" onPress={() => { setPayment(null); setProofUri(null); }} />
            </View>
          )}

          {payment.status === 'paid' && (
            <View style={{ marginTop: space.lg }}>
              <AppButton title="Kembali ke Katalog" variant="primary" onPress={() => { setPayment(null); setProofUri(null); }} />
              <View style={{ height: space.sm }} />
              <AppButton title="Langganan Saya" variant="secondary" onPress={() => navigation.navigate('MySubscriptions')} />
            </View>
          )}

          {payment.status === 'failed' && (
            <View style={{ marginTop: space.lg }}>
              <AppButton title="Kembali ke Katalog" variant="secondary" onPress={() => { setPayment(null); setProofUri(null); }} />
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
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: 'DMSans-SemiBold',
                          marginTop: 2,
                          color: p.is_subscribed ? c.semantic.positive : c.text.secondary,
                        }}
                        numberOfLines={1}
                      >
                        {p.is_subscribed ? `Aktif · ${p.days_remaining ?? 0} hari` : 'Belum aktif'}
                      </Text>
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

// Kotak QR: render QRIS statis Metavest. `qrisPath` adalah PATH RELATIF dari server
// (mis. "uploads/payment/metavest-qris.jpeg"); URL final dibangun lewat
// resolveAssetUrl() agar memakai host API (EXPO_PUBLIC_API_URL / Tailscale saat dev),
// BUKAN host/port backend mentah yang diblokir.
function QrBox({ qrisPath }: { qrisPath: string | null }) {
  const c = useColors();
  const uri = resolveAssetUrl(qrisPath);
  if (uri) {
    return (
      <View style={styles.qrWrap}>
        <Image source={{ uri }} style={styles.qrImage} resizeMode="contain" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: space.sm }}>
          <ShieldCheck size={14} color={c.semantic.positive} />
          <Text style={[typography.caption, { color: c.text.secondary }]}>QRIS resmi Metavest</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.qrWrap, { backgroundColor: '#fff', minHeight: 180 }]}>
      <QrCode size={140} color={c.bg.primary} strokeWidth={1.2} />
      <Text style={{ fontSize: 10, color: c.bg.primary, marginTop: space.sm, textAlign: 'center', paddingHorizontal: 8 }} numberOfLines={3}>
        QRIS belum tersedia.{'\n'}Silakan hubungi admin Metavest.
      </Text>
    </View>
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
  qrImage: { width: 200, height: 200 },
  proofPreview: { width: '100%', height: 180, borderRadius: radius.md, marginBottom: space.sm },
});
