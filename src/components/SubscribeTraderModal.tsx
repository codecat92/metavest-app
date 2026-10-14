import { View, Text, Modal, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { AlertTriangle, Gem } from 'lucide-react-native';
import { signalsApi, TraderSubscriptionSuccess, TraderSubscriptionError, SubscriptionPlans, SubscriptionPlanKey, PLAN_DEFS } from '@/api/signals';
import { BASE_URL } from '@/api/client';
import { useColors, space, radius, typography } from '@/theme';
import { formatMP } from '@/utils/format';
import { GlassCard, AppButton } from '@/components';
import { useCustomAlert } from '@/context/AlertContext';
import type { TabParamList, RootStackParamList } from '@/types/navigation';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const STORAGE_HOST = BASE_URL.replace(/\/api$/, '');

type ModalNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Signals'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type Props = {
  visible: boolean;
  trader: { id: string; name: string; avatar_url: string | null };
  plans: SubscriptionPlans;
  walletBalance: number;
  onClose: () => void;
  onSubscribed: (trader_id: string, newBalance: number) => void;
};

export default function SubscribeTraderModal({
  visible,
  trader,
  plans,
  walletBalance,
  onClose,
  onSubscribed,
}: Props) {
  const navigation = useNavigation<ModalNavProp>();
  const c = useColors();
  const { showAlert } = useCustomAlert();
  const [subscribing, setSubscribing] = useState(false);
  const [insufficient, setInsufficient] = useState(false);
  const [selected, setSelected] = useState<SubscriptionPlanKey>('monthly');

  const availablePlans = PLAN_DEFS.filter((p) => (plans[p.key] ?? 0) > 0);
  const availableKeys = availablePlans.map((p) => p.key).join(',');
  const selectedDef = PLAN_DEFS.find((p) => p.key === selected) ?? PLAN_DEFS[0];
  const selectedPrice = plans[selected] ?? 0;

  useEffect(() => {
    if (visible) {
      setInsufficient(false);
      setSelected(availablePlans[0]?.key ?? 'monthly');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, availableKeys]);

  const avatarSrc = trader.avatar_url
    ? (trader.avatar_url.startsWith('http')
        ? trader.avatar_url
        : `${STORAGE_HOST}/uploads/profilepic/${trader.avatar_url.split(/[\\/]/).pop()}`)
    : null;

  const handleSubscribe = useCallback(async () => {
    if (subscribing) return;
    setSubscribing(true);
    try {
      const res = await signalsApi.subscribeTrader(trader.id, selected);
      if (res.status === 200) {
        const data = res.data as TraderSubscriptionSuccess;
        onSubscribed(trader.id, data.wallet_balance ?? walletBalance);
        onClose();
      } else if (res.status === 409) {
        // sudah aktif — anggap sukses, saldo tidak berubah
        onSubscribed(trader.id, walletBalance);
        onClose();
      } else if (res.status === 402) {
        setInsufficient(true);
      } else {
        const err = (res.data as TraderSubscriptionError)?.error
          ?? (res.data as any)?.message
          ?? 'Subscribe failed. Please try again.';
        showAlert({ title: 'Error', message: err, type: 'error' });
      }
    } catch (e: any) {
      showAlert({
        title: 'Error',
        message: e?.message || 'Subscribe failed. Check your connection and try again.',
        type: 'error',
      });
    } finally {
      setSubscribing(false);
    }
  }, [subscribing, selected, trader.id, walletBalance, onClose, onSubscribed, showAlert]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: c.overlay.modal }]}>
        <GlassCard elevation={4}>
          {insufficient ? (
            <View style={styles.body}>
              <AlertTriangle size={40} color={c.semantic.warning} />
              <Text style={[typography.h4, { color: c.text.primary, textAlign: 'center', fontFamily: 'Manrope-Bold' }]}>
                Saldo MP Tidak Cukupi
              </Text>
              <Text style={[typography.body, { color: c.text.secondary, textAlign: 'center' }]}>
                Saldo Anda {formatMP(walletBalance)} MP, dibutuhkan {formatMP(selectedPrice)} MP. Silakan top up untuk melanjutkan.
              </Text>
              <AppButton
                title="Top Up"
                variant="primary"
                onPress={() => navigation.navigate('Wallet')}
                style={styles.btn}
              />
              <AppButton title="Tutup" variant="ghost" onPress={onClose} style={styles.btn} />
            </View>
          ) : (
            <View style={styles.body}>
              {avatarSrc ? (
                <Image source={{ uri: avatarSrc }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarText}>
                    {(trader.name || 'T').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={[typography.h4, { color: c.text.primary, textAlign: 'center', fontFamily: 'Manrope-Bold' }]}>
                Berlangganan {trader.name}
              </Text>

              {availablePlans.length > 1 && (
                <View style={styles.planRow}>
                  {availablePlans.map((p) => {
                    const active = p.key === selected;
                    return (
                      <TouchableOpacity
                        key={p.key}
                        onPress={() => setSelected(p.key)}
                        activeOpacity={0.85}
                        style={[
                          styles.planCard,
                          {
                            borderColor: active ? c.accent.gold : c.glass.border,
                            backgroundColor: active ? `${c.accent.gold}14` : c.glass.g1,
                          },
                        ]}
                      >
                        <Text style={[typography.captionBold, { color: active ? c.accent.gold : c.text.secondary }]}>
                          {p.short}
                        </Text>
                        <Text
                          numberOfLines={1}
                          allowFontScaling={false}
                          style={[typography.bodyBold, { color: active ? c.accent.gold : c.text.primary, marginTop: 2, fontFamily: 'Manrope-Bold' }]}
                        >
                          {formatMP(plans[p.key])}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View style={styles.priceRow}>
                <Gem size={14} color={c.accent.gold} />
                <Text style={[typography.bodyBold, { color: c.accent.gold, fontFamily: 'Manrope-Bold' }]}>
                  {formatMP(selectedPrice)} MP / {selectedDef.duration}
                </Text>
              </View>
              <Text style={[typography.caption, { color: c.text.secondary, textAlign: 'center' }]}>
                Akses semua signal berbayar dari trader ini selama {selectedDef.duration}.
              </Text>
              <View style={[styles.balanceCard, { backgroundColor: c.glass.g1, borderColor: c.glass.border }]}>
                <Text style={[typography.caption, { color: c.text.secondary }]}>Saldo Anda</Text>
                <Text style={[typography.bodyBold, { color: c.accent.gold, marginTop: 2, fontFamily: 'Manrope-Bold' }]}>
                  {formatMP(walletBalance)} MP
                </Text>
              </View>
              <AppButton
                title={subscribing ? 'Memproses...' : 'Subscribe'}
                variant="primary"
                onPress={handleSubscribe}
                loading={subscribing}
                style={styles.btn}
              />
              <AppButton title="Batal" variant="ghost" onPress={onClose} style={styles.btn} />
            </View>
          )}
        </GlassCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: space.xl,
  },
  body: {
    alignItems: 'center',
    gap: space.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallback: {
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    fontFamily: 'Manrope-Bold',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  planRow: {
    flexDirection: 'row',
    gap: space.sm,
    alignSelf: 'stretch',
  },
  planCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.md,
    paddingHorizontal: space.xs,
    minHeight: 58,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  balanceCard: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  btn: {
    alignSelf: 'stretch',
    marginTop: space.xs,
  },
});
