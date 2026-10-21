import { useCallback, useEffect, useState } from 'react';
import api from '@/services/api';
import { briefRadius, type Brief, type SavedArea } from '@/lib/brief';

/** The local brief for the followed area (or a saved area), plus "mark as read". */
export function useBrief(area: { latitude: number; longitude: number } | null, radiusKm: number) {
  const [areaId, setAreaId] = useState<string | null>(null);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [areas, setAreas] = useState<SavedArea[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!area && !areaId) return;
    setLoading(true);
    setError(null);
    try {
      const params = areaId ? { areaId } : { latitude: area!.latitude, longitude: area!.longitude, radius: briefRadius(radiusKm) };
      const [b, a] = await Promise.all([api.get<Brief>('/brief', { params }), api.get<SavedArea[]>('/brief/areas')]);
      setBrief(b.data);
      setAreas(a.data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [area, areaId, radiusKm]);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = useCallback(async () => {
    await api.post('/brief/seen');
    await load();
  }, [load]);

  const enable = useCallback(async () => {
    await api.patch('/brief/preferences', { enabled: true });
    await load();
  }, [load]);

  return { brief, areas, areaId, setAreaId, error, loading, reload: load, markRead, enable };
}
