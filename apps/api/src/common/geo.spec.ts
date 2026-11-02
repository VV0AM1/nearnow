import {
  approximateCoordinate,
  boundingBox,
  distanceKm,
  isValidLatitude,
  isValidLongitude,
} from './geo';

describe('geo', () => {
  it('computes known distances', () => {
    // Barcelona Plaça de Catalunya -> Sagrada Família ≈ 2.4 km
    const d = distanceKm(
      { latitude: 41.387, longitude: 2.17 },
      { latitude: 41.4036, longitude: 2.1744 },
    );
    expect(d).toBeGreaterThan(1.7);
    expect(d).toBeLessThan(2.2);
    expect(
      distanceKm(
        { latitude: 10, longitude: 10 },
        { latitude: 10, longitude: 10 },
      ),
    ).toBe(0);
  });

  it('treats 0,0 as a valid coordinate, not as "unset"', () => {
    expect(isValidLatitude(0)).toBe(true);
    expect(isValidLongitude(0)).toBe(true);
    expect(isValidLatitude(91)).toBe(false);
    expect(isValidLongitude(-181)).toBe(false);
    expect(isValidLatitude(NaN)).toBe(false);
  });

  it('keeps bounding boxes finite near the poles', () => {
    const box = boundingBox({ latitude: 89.99, longitude: 0 }, 50);
    expect(Number.isFinite(box.minLng)).toBe(true);
    expect(box.maxLat).toBeLessThanOrEqual(90);
  });

  it('bounding box contains every point within the radius', () => {
    const c = { latitude: 41.39, longitude: 2.17 };
    const box = boundingBox(c, 5);
    const east = {
      latitude: 41.39,
      longitude: 2.17 + 4.9 / (111.32 * Math.cos((41.39 * Math.PI) / 180)),
    };
    expect(distanceKm(c, east)).toBeLessThan(5);
    expect(east.longitude).toBeLessThan(box.maxLng);
  });

  it('approximates to a ~300 m grid', () => {
    const lat = 41.387654;
    const approx = approximateCoordinate(lat);
    expect(Math.abs(approx - lat) * 111_320).toBeLessThanOrEqual(150 + 1e-6);
    expect(approximateCoordinate(41.3877)).toBe(approximateCoordinate(41.3878));
  });
});
