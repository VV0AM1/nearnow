import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { useI18n } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import { useToast } from '@/context/ToastContext';
import { Button, Field, useColors } from './ui';

const REASONS = ['SPAM', 'HARASSMENT', 'PRIVATE_INFORMATION', 'UNVERIFIED_ACCUSATION', 'MISLEADING', 'HATE_OR_VIOLENCE', 'OTHER'] as const;

export function ReportSheet({ postId, visible, onClose }: { postId: string; visible: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const c = useColors();
  const { showToast } = useToast();
  const [reason, setReason] = useState<(typeof REASONS)[number] | null>(null);
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setReason(null);
    setDetails('');
    setError(null);
    onClose();
  };

  const submit = async () => {
    if (!reason || sending) return;
    setSending(true);
    setError(null);
    try {
      await api.post('/reports', { postId, reason, details: details.trim() || undefined });
      showToast(t('report.thanks'), 'success');
      close();
    } catch (e) {
      setError(describeError(e, t));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View style={{ backgroundColor: c.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text accessibilityRole="header" style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>
              {t('report.title')}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={close} hitSlop={10}>
              <Ionicons name="close" size={24} color={c.text} />
            </Pressable>
          </View>
          <Text style={{ color: c.muted, marginBottom: 12 }}>{t('report.intro')}</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            {REASONS.map((r) => (
              <Pressable
                key={r}
                accessibilityRole="radio"
                accessibilityState={{ checked: reason === r }}
                onPress={() => setReason(r)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}
              >
                <Ionicons name={reason === r ? 'radio-button-on' : 'radio-button-off'} size={22} color={c.primary} />
                <Text style={{ color: c.text, fontSize: 16 }}>{t(`report.${r}`)}</Text>
              </Pressable>
            ))}
            <View style={{ height: 8 }} />
            <Field label={t('report.details')} value={details} onChangeText={setDetails} multiline max={500} style={{ minHeight: 80, textAlignVertical: 'top' }} />
            {error ? <Text style={{ color: c.danger, marginBottom: 12 }}>{error}</Text> : null}
            <Button title={t('report.submit')} onPress={submit} loading={sending} disabled={!reason} variant="danger" />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
