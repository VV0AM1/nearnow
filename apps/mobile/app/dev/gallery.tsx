import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import {
  Avatar,
  Badge,
  Banner,
  Button,
  Card,
  Chip,
  GlassSurface,
  IconButton,
  ListRow,
  ListSection,
  ListSwitchRow,
  SearchField,
  SegmentedControl,
  Skeleton,
  StateView,
  Text,
  TextField,
  useTokens,
  type TextVariant,
} from '@/design';

const TYPE_RAMP: TextVariant[] = ['largeTitle', 'title1', 'title2', 'title3', 'headline', 'body', 'callout', 'subheadline', 'footnote', 'caption1', 'caption2'];

/** Design-kit review screen. Development builds only — release builds redirect away. */
export default function Gallery() {
  if (!__DEV__) return <Redirect href="/" />;
  return <GalleryContent />;
}

function GalleryContent() {
  const t = useTokens();
  const { themeMode, setThemeMode } = useTheme();
  const [chip, setChip] = useState('all');
  const [seg, setSeg] = useState<'list' | 'map'>('list');
  const [search, setSearch] = useState('');
  const [field, setField] = useState('');
  const [toggle, setToggle] = useState(true);
  const swatches = Object.entries(t.colors);

  return (
    <ScrollView style={{ backgroundColor: t.colors.background }} contentContainerStyle={{ padding: t.space.lg, gap: t.space.xl }}>
      <Stack.Screen options={{ title: 'Design kit' }} />

      <SegmentedControl
        accessibilityLabel="Appearance"
        options={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'system', label: 'System' },
        ]}
        value={themeMode}
        onChange={setThemeMode}
      />
      <Text variant="footnote" tone="secondary">
        Reduce Motion: {t.reduceMotion ? 'on' : 'off'} · scheme: {t.scheme}
      </Text>

      <Section title="Colour">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space.sm }}>
          {swatches.map(([name, value]) => (
            <View key={name} style={{ width: 96, gap: 4 }}>
              <View style={{ height: 40, borderRadius: t.radius.sm, backgroundColor: value, borderWidth: 0.5, borderColor: t.colors.separator }} />
              <Text variant="caption2" tone="secondary">
                {name}
              </Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Type">
        {TYPE_RAMP.map((v) => (
          <Text key={v} variant={v}>
            {v}
          </Text>
        ))}
      </Section>

      <Section title="Buttons">
        <Button title="Filled" onPress={() => undefined} block />
        <Button title="Tinted with icon" icon="add" variant="tinted" onPress={() => undefined} block />
        <Button title="Plain" variant="plain" onPress={() => undefined} />
        <Button title="Destructive" variant="destructive" onPress={() => undefined} block />
        <Button title="Destructive tinted" variant="destructiveTinted" onPress={() => undefined} block />
        <View style={{ flexDirection: 'row', gap: t.space.sm }}>
          <Button title="Loading" loading onPress={() => undefined} style={{ flex: 1 }} />
          <Button title="Disabled" disabled onPress={() => undefined} style={{ flex: 1 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: t.space.sm, alignItems: 'center' }}>
          <Button title="Small" size="small" onPress={() => undefined} />
          <IconButton icon="notifications-outline" label="Notifications" badge={3} onPress={() => undefined} />
          <IconButton icon="locate" label="Recenter" variant="filled" onPress={() => undefined} />
          <IconButton icon="bookmark" label="Saved" selected onPress={() => undefined} />
        </View>
      </Section>

      <Section title="Controls">
        <SegmentedControl
          accessibilityLabel="View"
          options={[
            { value: 'list', label: 'List' },
            { value: 'map', label: 'Map' },
          ]}
          value={seg}
          onChange={setSeg}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space.sm }}>
          {['all', 'events', 'lost & found', 'disruptions'].map((c) => (
            <Chip key={c} label={c} selected={chip === c} onPress={() => setChip(c)} />
          ))}
        </View>
        <SearchField value={search} onChangeText={setSearch} placeholder="Search updates" />
        <TextField label="Title" value={field} onChangeText={setField} max={120} hint="Short summary of what changed" />
        <TextField label="With error" value="x" onChangeText={() => undefined} error="Use 3–120 characters." />
      </Section>

      <Section title="Lists">
        <ListSection header="Account" footer="Grouped list in the iOS Settings style.">
          <ListRow title="My area" value="Barcelona" icon="location-outline" onPress={() => undefined} />
          <ListRow title="Alerts" icon="notifications-outline" iconColor="#FF9500" onPress={() => undefined} />
          <ListSwitchRow title="Pause alerts" subtitle="Stop all nearby alerts" icon="time-outline" iconColor="#8E8E93" value={toggle} onValueChange={setToggle} />
          <ListRow title="Delete account" icon="trash-outline" destructive onPress={() => undefined} />
        </ListSection>
      </Section>

      <Section title="Status">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space.sm }}>
          <Badge label="Community report" icon="people" />
          <Badge label="Confirmed by 3 people" tone="accent" icon="checkmark-done" />
          <Badge label="Resolved" tone="success" icon="checkmark-done" />
          <Badge label="May be outdated" tone="warning" icon="hourglass-outline" />
          <Badge label="Urgent help" tone="danger" icon="alert-circle" />
        </View>
        <Banner message="You're offline. Showing the last loaded posts." tone="warning" icon="cloud-offline-outline" actionLabel="Retry" onAction={() => undefined} />
        <Card>
          <View style={{ flexDirection: 'row', gap: t.space.md, alignItems: 'center' }}>
            <Avatar name="Neighbour" />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton width="70%" />
              <Skeleton width="40%" height={12} />
            </View>
          </View>
        </Card>
        <StateView kind="empty" title="Nothing new here yet" body="No reports found in your selected area." actionLabel="Change area" onAction={() => undefined} />
        <StateView kind="error" title="Couldn't load posts" body="Check your connection and try again." actionLabel="Try again" onAction={() => undefined} />
      </Section>

      <Section title="Materials">
        <View style={{ height: 140, borderRadius: t.radius.lg, backgroundColor: t.colors.accent, justifyContent: 'flex-end', padding: t.space.md }}>
          <GlassSurface style={{ padding: t.space.md, flexDirection: 'row', alignItems: 'center', gap: t.space.sm }}>
            <IconButton icon="locate" label="Recenter" onPress={() => undefined} />
            <Text variant="headline">Floating glass control</Text>
          </GlassSurface>
        </View>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const t = useTokens();
  return (
    <View style={{ gap: t.space.md }}>
      <Text variant="title2">{title}</Text>
      {children}
    </View>
  );
}
