import {
  auth,
  createTestApp,
  registerUser,
  TestContext,
  TestUser,
} from './helpers';

/** An isolated spot so posts from other suites never fall inside the brief area. */
const SPOT = { latitude: 10.1234, longitude: -20.4567 };
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('Local change brief (e2e)', () => {
  let ctx: TestContext;
  let reader: TestUser;
  let author: TestUser;
  let other: TestUser;

  beforeAll(async () => {
    ctx = await createTestApp();
    reader = await registerUser(ctx, 'Reader');
    author = await registerUser(ctx, 'Author');
    other = await registerUser(ctx, 'Other');
  });
  afterAll(async () => {
    await ctx.app.close();
  });
  beforeEach(() => ctx.rateLimit.reset());

  const post = (u: TestUser, body: Record<string, unknown>) =>
    ctx
      .http()
      .post('/posts')
      .set(auth(u))
      .send({
        title: 'Street closed for works',
        category: 'GENERAL',
        ...SPOT,
        ...body,
      })
      .expect(201);
  const brief = (
    u: TestUser,
    query: Record<string, unknown> = { ...SPOT, radius: 2 },
  ) => ctx.http().get('/brief').set(auth(u)).query(query);

  it('requires sign-in and an area', async () => {
    await ctx.http().get('/brief').query(SPOT).expect(401);
    await ctx.http().get('/brief').set(auth(reader)).expect(400);
    await brief(reader, { ...SPOT, radius: 50 }).expect(400);
  });

  it('lists new posts by others with provenance, and never the reader’s own', async () => {
    const theirs = await post(author, { title: 'Market moved to the square' });
    await post(reader, { title: 'My own update' });
    const res = await brief(reader).expect(200);
    expect(res.body.enabled).toBe(true);
    const ids = res.body.items.map((i: { postId: string }) => i.postId);
    expect(ids).toContain(theirs.body.id);
    expect(JSON.stringify(res.body)).not.toContain('My own update');
    const item = res.body.items.find(
      (i: { postId: string }) => i.postId === theirs.body.id,
    );
    expect(item).toMatchObject({
      change: 'NEW',
      provenance: 'UNCONFIRMED',
      category: 'GENERAL',
    });
    expect(res.body.counts.new).toBeGreaterThanOrEqual(1);
    expect(res.body.counts.unconfirmedNew).toBeGreaterThanOrEqual(1);
    expect(res.body.activeInArea).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(res.body)).not.toContain('@example.com');
  });

  it('after "mark as seen", shows only what changed since: resolutions and confirmations', async () => {
    const a = await post(author, { title: 'Lift out of service' });
    const b = await post(author, { title: 'Pavement blocked by scaffolding' });
    await ctx.http().post('/brief/seen').set(auth(reader)).expect(200);
    await pause(20);

    let res = await brief(reader).expect(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.counts.new).toBe(0);

    await ctx
      .http()
      .patch(`/posts/${a.body.id}/resolve`)
      .set(auth(author))
      .send({})
      .expect(200);
    await ctx
      .http()
      .post(`/posts/${b.body.id}/confirm`)
      .set(auth(other))
      .send({ state: 'STILL_HAPPENING' })
      .expect(200);

    res = await brief(reader).expect(200);
    const byId = Object.fromEntries(
      res.body.items.map((i: { postId: string; change: string }) => [
        i.postId,
        i.change,
      ]),
    );
    expect(byId[a.body.id]).toBe('RESOLVED');
    expect(byId[b.body.id]).toBe('CONFIRMED');
    expect(res.body.counts).toMatchObject({
      resolved: 1,
      confirmed: 1,
      new: 0,
    });
  });

  it('respects topic preferences and the off switch', async () => {
    await ctx
      .http()
      .patch('/brief/preferences')
      .set(auth(reader))
      .send({ categories: ['EVENT'] })
      .expect(200);
    await ctx
      .http()
      .patch('/brief/preferences')
      .set(auth(reader))
      .send({ categories: ['NOPE'] })
      .expect(400);
    await post(author, { title: 'Pop-up repair café', category: 'EVENT' });
    await post(author, { title: 'Bins not collected', category: 'GENERAL' });
    let res = await brief(reader).expect(200);
    expect(res.body.categories).toEqual(['EVENT']);
    expect(
      res.body.items.every((i: { category: string }) => i.category === 'EVENT'),
    ).toBe(true);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);

    await ctx
      .http()
      .patch('/brief/preferences')
      .set(auth(reader))
      .send({ enabled: false })
      .expect(200);
    res = await brief(reader).expect(200);
    expect(res.body).toMatchObject({ enabled: false, items: [] });
    await ctx
      .http()
      .patch('/brief/preferences')
      .set(auth(reader))
      .send({ enabled: true, categories: [] })
      .expect(200);
  });

  it('manages saved areas per user, with a limit, and briefs by saved area', async () => {
    const created = await ctx
      .http()
      .post('/brief/areas')
      .set(auth(reader))
      .send({ label: '  Home  ', ...SPOT, radiusKm: 1 })
      .expect(201);
    expect(created.body).toMatchObject({ label: 'Home', radiusKm: 1 });

    await ctx
      .http()
      .post('/brief/areas')
      .set(auth(reader))
      .send({ label: '', ...SPOT })
      .expect(400);
    await ctx
      .http()
      .post('/brief/areas')
      .set(auth(reader))
      .send({ label: 'Far', latitude: 95, longitude: 0 })
      .expect(400);

    const res = await brief(reader, { areaId: created.body.id }).expect(200);
    expect(res.body.area).toMatchObject({
      id: created.body.id,
      label: 'Home',
      radiusKm: 1,
    });

    // Another user can neither read a brief for it nor delete it.
    await brief(other, { areaId: created.body.id }).expect(404);
    await ctx
      .http()
      .delete(`/brief/areas/${created.body.id}`)
      .set(auth(other))
      .expect(404);

    for (let i = 0; i < 4; i++)
      await ctx
        .http()
        .post('/brief/areas')
        .set(auth(reader))
        .send({ label: `Place ${i}`, ...SPOT })
        .expect(201);
    await ctx
      .http()
      .post('/brief/areas')
      .set(auth(reader))
      .send({ label: 'Sixth', ...SPOT })
      .expect(400);

    const list = await ctx
      .http()
      .get('/brief/areas')
      .set(auth(reader))
      .expect(200);
    expect(list.body).toHaveLength(5);
    await ctx
      .http()
      .delete(`/brief/areas/${created.body.id}`)
      .set(auth(reader))
      .expect(200);
    expect(
      (await ctx.http().get('/brief/areas').set(auth(reader)).expect(200)).body,
    ).toHaveLength(4);
  });

  it('deleting the account removes saved areas and brief preferences', async () => {
    const u = await registerUser(ctx, 'Leaver');
    await ctx
      .http()
      .post('/brief/areas')
      .set(auth(u))
      .send({ label: 'Work', ...SPOT })
      .expect(201);
    await ctx.http().post('/brief/seen').set(auth(u)).expect(200);
    await ctx
      .http()
      .delete('/users/me')
      .set(auth(u))
      .send({ confirm: 'DELETE' })
      .expect(200);
    expect(await ctx.prisma.savedArea.count({ where: { userId: u.id } })).toBe(
      0,
    );
    expect(
      await ctx.prisma.briefPreferences.count({ where: { userId: u.id } }),
    ).toBe(0);
  });
});
