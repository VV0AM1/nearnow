import { Category } from '@prisma/client';

/**
 * Integration boundary for official/public local-data feeds (transport disruptions,
 * road closures, municipal notices, public events).
 *
 * No provider is configured in this repository. A provider may only be registered
 * after its API terms/licence, attribution, refresh cadence and provenance are
 * documented in docs/official-data.md. Ingested records are stored as posts with
 * sourceType=OFFICIAL, sourceName/sourceUrl/sourceExternalId set (deduplicated by the
 * unique (sourceName, sourceExternalId) index) and verificationStatus=OFFICIAL_SOURCE.
 * Without a configured provider the feature stays hidden — nothing is fabricated.
 */
export interface OfficialRecord {
  externalId: string;
  title: string;
  content?: string;
  category: Category;
  latitude: number;
  longitude: number;
  sourceUrl: string;
  startsAt?: Date;
  expiresAt?: Date;
  /** True when the source withdrew/cancelled the record. */
  withdrawn?: boolean;
}

export interface OfficialDataProvider {
  /** Stable identifier stored in Post.sourceName and shown to users, e.g. "TMB". */
  readonly name: string;
  readonly attribution: string;
  readonly refreshIntervalMs: number;
  fetchUpdates(since: Date | null): Promise<OfficialRecord[]>;
}

/** Providers enabled for this deployment. Intentionally empty until one is sourced and approved. */
export const OFFICIAL_DATA_PROVIDERS: OfficialDataProvider[] = [];
