import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { io as connect, Socket } from 'socket.io-client';
import {
  auth,
  BCN,
  createTestApp,
  registerUser,
  TestContext,
  TestUser,
} from './helpers';
import { tinyPng } from './fixtures/images';

describe('NearNow API (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });
  beforeEach(() => ctx.rateLimit.reset());

  const createPost = (u: TestUser, body: Record<string, unknown>) =>
    ctx
      .http()
      .post('/posts')
      .set(auth(u))
      .send({
        title: 'Street market today',
        category: 'GENERAL',
        ...BCN,
        ...body,
      });

  describe('authentication', () => {
    it('signs up, stores a bcrypt hash and signs in with the emailed code', async () => {
      const u = await registerUser(ctx);
      const authRow = await ctx.prisma.auth.findUnique({
        where: { userId: u.id },
      });
      expect(authRow!.passwordHash).toMatch(/^\$2[aby]\$/);
      expect(authRow!.emailOtp).toBeNull();
      await ctx.http().get('/users/me').set(auth(u)).expect(200);
    });

    it('rejects the former master code 123456', async () => {
      const u = await registerUser(ctx);
      await ctx
        .http()
        .post('/auth/login')
        .send({ email: u.email, password: u.password })
        .expect(200);
      const real = ctx.email.codes.get(u.email)!;
      const guess = real === '123456' ? '654321' : '123456';
      await ctx
        .http()
        .post('/auth/otp/verify')
        .send({ email: u.email, otp: guess })
        .expect(401);
    });

    it('locks the code after 5 wrong attempts', async () => {
      const u = await registerUser(ctx);
      await ctx
        .http()
        .post('/auth/login')
        .send({ email: u.email, password: u.password })
        .expect(200);
      const real = ctx.email.codes.get(u.email)!;
      const wrong = real === '000000' ? '111111' : '000000';
      for (let i = 0; i < 5; i++)
        await ctx
          .http()
          .post('/auth/otp/verify')
          .send({ email: u.email, otp: wrong })
          .expect(401);
      await ctx
        .http()
        .post('/auth/otp/verify')
        .send({ email: u.email, otp: real })
        .expect(401);
    });

    it('gives the same answer for unknown emails and wrong passwords', async () => {
      const u = await registerUser(ctx);
      const a = await ctx
        .http()
        .post('/auth/login')
        .send({ email: u.email, password: 'wrong-password' })
        .expect(401);
      const b = await ctx
        .http()
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: 'wrong-password' })
        .expect(401);
      expect(a.body.message).toBe(b.body.message);
      const f1 = await ctx
        .http()
        .post('/auth/forgot-password')
        .send({ email: u.email })
        .expect(200);
      const f2 = await ctx
        .http()
        .post('/auth/forgot-password')
        .send({ email: 'nobody@example.com' })
        .expect(200);
      expect(f1.body).toEqual(f2.body);
    });

    it('upgrades a legacy plaintext password on login', async () => {
      const u = await registerUser(ctx);
      await ctx.prisma.auth.update({
        where: { userId: u.id },
        data: { passwordHash: 'legacy-plain-1' },
      });
      await ctx
        .http()
        .post('/auth/login')
        .send({ email: u.email, password: 'legacy-plain-1' })
        .expect(200);
      const row = await ctx.prisma.auth.findUnique({ where: { userId: u.id } });
      expect(row!.passwordHash).toMatch(/^\$2[aby]\$/);
    });

    it('rejects tokens of blocked accounts immediately', async () => {
      const u = await registerUser(ctx);
      await ctx.prisma.user.update({
        where: { id: u.id },
        data: { isBlocked: true },
      });
      await ctx.http().get('/users/me').set(auth(u)).expect(401);
      await createPost(u, {}).expect(401);
    });
  });

  describe('cross-user access', () => {
    let alice: TestUser;
    let bob: TestUser;
    beforeAll(async () => {
      alice = await registerUser(ctx, 'Alice');
      bob = await registerUser(ctx, 'Bob');
    });

    it("cannot mark another user's notification as read", async () => {
      const n = await ctx.prisma.notification.create({
        data: { userId: alice.id, type: 'INFO', message: 'private' },
      });
      await ctx
        .http()
        .post(`/notifications/me/read/${n.id}`)
        .set(auth(bob))
        .expect(404);
      expect(
        (await ctx.prisma.notification.findUnique({ where: { id: n.id } }))!
          .read,
      ).toBe(false);
      await ctx
        .http()
        .post(`/notifications/me/read/${n.id}`)
        .set(auth(alice))
        .expect(200);
    });

    it('legacy :userId notification/settings/saved routes no longer exist', async () => {
      await ctx
        .http()
        .get(`/notifications/${alice.id}`)
        .set(auth(bob))
        .expect(404);
      await ctx
        .http()
        .get(`/notifications/settings/${alice.id}`)
        .set(auth(bob))
        .expect(404);
      await ctx
        .http()
        .put(`/notifications/settings/${alice.id}`)
        .set(auth(bob))
        .send({ radiusKm: 1 })
        .expect(404);
      await ctx
        .http()
        .get(`/users/${alice.id}/saved`)
        .set(auth(bob))
        .expect(404);
    });

    it('settings and saved items are per-user', async () => {
      await ctx
        .http()
        .patch('/notifications/me/settings')
        .set(auth(alice))
        .send({ radiusKm: 3, ...BCN, categories: ['GENERAL'] })
        .expect(200);
      const bobSettings = await ctx
        .http()
        .get('/notifications/me/settings')
        .set(auth(bob))
        .expect(200);
      expect(bobSettings.body.hasAlertArea).toBe(false);
      const post = await createPost(alice, {}).expect(201);
      await ctx
        .http()
        .post(`/users/me/saved/${post.body.id}`)
        .set(auth(bob))
        .expect(201);
      const aliceSaved = await ctx
        .http()
        .get('/users/me/saved')
        .set(auth(alice))
        .expect(200);
      expect(aliceSaved.body).toHaveLength(0);
    });

    it('only the author or a moderator can resolve a post', async () => {
      const post = await createPost(alice, {
        title: 'Road closed at Carrer Major',
        category: 'SAFETY',
      }).expect(201);
      await ctx
        .http()
        .patch(`/posts/${post.body.id}/resolve`)
        .set(auth(bob))
        .send({})
        .expect(403);
      const res = await ctx
        .http()
        .patch(`/posts/${post.body.id}/resolve`)
        .set(auth(alice))
        .send({ note: 'Reopened' })
        .expect(200);
      expect(res.body.status).toBe('RESOLVED');
    });

    it('regular users cannot moderate', async () => {
      const post = await createPost(alice, {}).expect(201);
      await ctx
        .http()
        .patch(`/posts/${post.body.id}/remove`)
        .set(auth(bob))
        .send({ reason: 'nope nope' })
        .expect(403);
      await ctx.http().get('/admin/reports').set(auth(bob)).expect(403);
    });

    it('moderator removal is audited and hides the post from others', async () => {
      const mod = await registerUser(ctx, 'Mod');
      await ctx.prisma.user.update({
        where: { id: mod.id },
        data: { role: 'MODERATOR' },
      });
      const post = await createPost(alice, {}).expect(201);
      await ctx
        .http()
        .patch(`/posts/${post.body.id}/remove`)
        .set(auth(mod))
        .send({ reason: 'Shares private data' })
        .expect(200);
      await ctx.http().get(`/posts/${post.body.id}`).set(auth(bob)).expect(404);
      await ctx
        .http()
        .get(`/posts/${post.body.id}`)
        .set(auth(alice))
        .expect(200);
      const log = await ctx.prisma.moderationAction.findMany({
        where: { targetId: post.body.id },
      });
      expect(log).toEqual([
        expect.objectContaining({ action: 'REMOVE_POST', actorId: mod.id }),
      ]);
    });
  });

  describe('posts and feed', () => {
    let author: TestUser;
    beforeAll(async () => {
      author = await registerUser(ctx, 'Author');
    });

    it('validates coordinates, categories and lengths', async () => {
      await createPost(author, { latitude: 95 }).expect(400);
      await createPost(author, { category: 'NOT_A_CATEGORY' }).expect(400);
      await createPost(author, { title: 'x' }).expect(400);
      await createPost(author, { title: '   ' }).expect(400);
      await ctx
        .http()
        .get('/posts/feed?latitude=41&longitude=2&radius=500')
        .expect(400);
      await ctx
        .http()
        .get('/posts/feed?latitude=41&longitude=2&limit=1000')
        .expect(400);
      await ctx.http().get('/posts').expect(400); // no unbounded "all posts" listing
    });

    it('accepts (0,0) as a real location', async () => {
      await createPost(author, { latitude: 0, longitude: 0 }).expect(201);
    });

    it('rejects payment card numbers in posts', async () => {
      await createPost(author, {
        title: 'Found card 4111 1111 1111 1111',
      }).expect(400);
    });

    it('public responses never include author emails', async () => {
      await createPost(author, { title: 'Bakery open late tonight' }).expect(
        201,
      );
      const feed = await ctx
        .http()
        .get('/posts/feed')
        .query({ ...BCN, radius: 2 })
        .expect(200);
      expect(feed.body.length).toBeGreaterThan(0);
      expect(JSON.stringify(feed.body)).not.toContain('@example.com');
      expect(feed.body[0].author).toEqual({
        id: expect.any(String),
        name: expect.any(String),
        avatar: null,
      });
    });

    it('filters server-side by radius, category, search and time', async () => {
      await createPost(author, {
        title: 'Concert in the square',
        category: 'EVENT',
      }).expect(201);
      await createPost(author, {
        title: 'Far away notice',
        latitude: 41.6,
        longitude: 2.5,
      }).expect(201);
      const events = await ctx
        .http()
        .get('/posts/feed')
        .query({ ...BCN, radius: 3, category: 'EVENT' })
        .expect(200);
      expect(events.body.every((p: any) => p.category === 'EVENT')).toBe(true);
      const near = await ctx
        .http()
        .get('/posts/feed')
        .query({ ...BCN, radius: 3, search: 'Far away' })
        .expect(200);
      expect(near.body).toHaveLength(0);
      const found = await ctx
        .http()
        .get('/posts/feed')
        .query({ ...BCN, radius: 3, search: 'concert', since: '24h' })
        .expect(200);
      expect(found.body[0].title).toBe('Concert in the square');
      expect(found.body[0].distanceKm).toBeLessThan(3);
    });

    it('hides expired reports unless asked, and reports them as EXPIRED', async () => {
      const p = await createPost(author, {
        title: 'Old incident report',
        category: 'CRIME',
      }).expect(201);
      await ctx.prisma.post.update({
        where: { id: p.body.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });
      const active = await ctx
        .http()
        .get('/posts/feed')
        .query({ ...BCN, radius: 3, category: 'CRIME' })
        .expect(200);
      expect(active.body.find((x: any) => x.id === p.body.id)).toBeUndefined();
      const all = await ctx
        .http()
        .get('/posts/feed')
        .query({
          ...BCN,
          radius: 3,
          category: 'CRIME',
          includeInactive: 'true',
        })
        .expect(200);
      expect(all.body.find((x: any) => x.id === p.body.id).status).toBe(
        'EXPIRED',
      );
    });

    it('stores approximate locations rounded', async () => {
      const p = await createPost(author, {
        approximateLocation: true,
        latitude: 41.387654,
        longitude: 2.168654,
      }).expect(201);
      expect(p.body.isApproximateLocation).toBe(true);
      expect(p.body.latitude).not.toBe(41.387654);
    });

    it('uploads an image via multipart, strips metadata and serves it', async () => {
      const res = await ctx
        .http()
        .post('/posts')
        .set(auth(author))
        .field('title', 'Photo of the fountain')
        .field('category', 'GENERAL')
        .field('latitude', String(BCN.latitude))
        .field('longitude', String(BCN.longitude))
        .field('approximateLocation', 'false')
        .attach('file', tinyPng(), {
          filename: 'photo.png',
          contentType: 'image/png',
        })
        .expect(201);
      expect(res.body.imageUrl).toMatch(/^\/uploads\/[0-9a-f-]+\.png$/);
      expect(res.body.isApproximateLocation).toBe(false);
      const stored = readFileSync(
        join(
          process.env.UPLOAD_DIR!,
          res.body.imageUrl.replace('/uploads/', ''),
        ),
      );
      expect(stored.includes(Buffer.from('GPS'))).toBe(false);
      const served = await ctx.http().get(res.body.imageUrl).expect(200);
      expect(served.headers['x-content-type-options']).toBe('nosniff');
    });

    it('rejects a non-image disguised as .png and leaves no file behind', async () => {
      const before = readdirSync(process.env.UPLOAD_DIR!).length;
      await ctx
        .http()
        .post('/posts')
        .set(auth(author))
        .field('title', 'Sneaky upload')
        .field('category', 'GENERAL')
        .field('latitude', String(BCN.latitude))
        .field('longitude', String(BCN.longitude))
        .attach('file', Buffer.from('<script>alert(1)</script>'), {
          filename: 'x.png',
          contentType: 'image/png',
        })
        .expect(400);
      expect(readdirSync(process.env.UPLOAD_DIR!).length).toBe(before);
    });

    it('votes toggle and the viewer state is returned with the feed', async () => {
      const voter = await registerUser(ctx, 'Voter');
      const p = await createPost(author, {
        title: 'Free books on the corner',
      }).expect(201);
      expect(
        (
          await ctx
            .http()
            .post(`/posts/${p.body.id}/vote`)
            .set(auth(voter))
            .send({})
            .expect(200)
        ).body,
      ).toEqual({ liked: true, likes: 1 });
      const feed = await ctx
        .http()
        .get('/posts/feed')
        .query({ ...BCN, radius: 1, search: 'Free books' })
        .set(auth(voter))
        .expect(200);
      expect(feed.body[0].viewer).toMatchObject({
        hasVoted: true,
        isAuthor: false,
      });
      expect(
        (
          await ctx
            .http()
            .post(`/posts/${p.body.id}/vote`)
            .set(auth(voter))
            .send({})
            .expect(200)
        ).body,
      ).toEqual({ liked: false, likes: 0 });
    });

    it('community confirmation needs two people and excludes the author', async () => {
      const p = await createPost(author, {
        title: 'Water leak on the pavement',
        category: 'SAFETY',
      }).expect(201);
      await ctx
        .http()
        .post(`/posts/${p.body.id}/confirm`)
        .set(auth(author))
        .send({ state: 'STILL_HAPPENING' })
        .expect(400);
      const [c1, c2] = [await registerUser(ctx), await registerUser(ctx)];
      const r1 = await ctx
        .http()
        .post(`/posts/${p.body.id}/confirm`)
        .set(auth(c1))
        .send({ state: 'STILL_HAPPENING' })
        .expect(200);
      expect(r1.body.verificationStatus).toBe('UNVERIFIED');
      const r2 = await ctx
        .http()
        .post(`/posts/${p.body.id}/confirm`)
        .set(auth(c2))
        .send({ state: 'STILL_HAPPENING' })
        .expect(200);
      expect(r2.body.verificationStatus).toBe('COMMUNITY_CONFIRMED');
      // Flip-flopping is rate limited.
      await ctx
        .http()
        .post(`/posts/${p.body.id}/confirm`)
        .set(auth(c1))
        .send({ state: 'NO_LONGER_PRESENT' })
        .expect(429);
    });

    it('rejects duplicate abuse reports', async () => {
      const reporter = await registerUser(ctx);
      const p = await createPost(author, {
        title: 'Questionable post here',
      }).expect(201);
      await ctx
        .http()
        .post('/reports')
        .set(auth(reporter))
        .send({ postId: p.body.id, reason: 'SPAM' })
        .expect(201);
      await ctx
        .http()
        .post('/reports')
        .set(auth(reporter))
        .send({ postId: p.body.id, reason: 'SPAM' })
        .expect(409);
      await ctx
        .http()
        .post('/reports')
        .set(auth(reporter))
        .send({ postId: p.body.id, reason: 'made-up' })
        .expect(400);
    });
  });

  describe('nearby alerts (urgent help policy)', () => {
    it('reaches only opted-in people near the request, and reports the real count', async () => {
      const sender = await registerUser(ctx, 'Sender');
      const optedIn = await registerUser(ctx, 'OptedIn');
      const notOpted = await registerUser(ctx, 'NotOpted');
      const noArea = await registerUser(ctx, 'NoArea');
      const far = await registerUser(ctx, 'Far');
      const set = (u: TestUser, body: object) =>
        ctx
          .http()
          .patch('/notifications/me/settings')
          .set(auth(u))
          .send(body)
          .expect(200);
      await set(optedIn, { ...BCN, radiusKm: 5, categories: ['DANGER'] });
      await set(notOpted, { ...BCN, radiusKm: 5, categories: ['GENERAL'] });
      await set(noArea, { categories: ['DANGER'] });
      await set(far, {
        latitude: 41.6,
        longitude: 2.5,
        radiusKm: 25,
        categories: ['DANGER'],
      });

      const res = await createPost(sender, {
        title: 'Need help with an injured cyclist',
        category: 'DANGER',
      }).expect(201);
      expect(res.body.alertSummary).toEqual({ notified: 1, pushDelivered: 0 });

      const count = async (u: TestUser) =>
        (await ctx.http().get('/notifications/me').set(auth(u)).expect(200))
          .body.items.length;
      expect(await count(optedIn)).toBe(1);
      expect(await count(notOpted)).toBe(0);
      expect(await count(noArea)).toBe(0);
      expect(await count(far)).toBe(0);
      expect(await count(sender)).toBe(0);
    });
  });

  describe('lost & found', () => {
    it('suggests matches to the owner only and supports private contact + block', async () => {
      const [loser, finder, stranger] = [
        await registerUser(ctx, 'Loser'),
        await registerUser(ctx, 'Finder'),
        await registerUser(ctx, 'Stranger'),
      ];
      const lost = await createPost(loser, {
        title: 'Lost keys with red keyring',
        category: 'LOST_FOUND',
        lostFoundDirection: 'LOST',
        lostFoundItemType: 'KEYS',
      }).expect(201);
      await createPost(finder, {
        title: 'Missing direction',
        category: 'LOST_FOUND',
      }).expect(400);
      const found = await createPost(finder, {
        title: 'Found keys, red keyring',
        category: 'LOST_FOUND',
        lostFoundDirection: 'FOUND',
        lostFoundItemType: 'KEYS',
        latitude: BCN.latitude + 0.001,
      }).expect(201);

      const matches = await ctx
        .http()
        .get(`/lost-found/${lost.body.id}/matches`)
        .set(auth(loser))
        .expect(200);
      expect(matches.body.items[0]).toMatchObject({
        label: 'Possible match',
        post: { id: found.body.id },
      });
      expect(JSON.stringify(matches.body)).not.toContain('@example.com');
      await ctx
        .http()
        .get(`/lost-found/${lost.body.id}/matches`)
        .set(auth(stranger))
        .expect(403);

      const req = await ctx
        .http()
        .post(`/lost-found/${found.body.id}/contact-requests`)
        .set(auth(loser))
        .send({
          message: 'I think these are my keys, they have a red keyring.',
          relatedPostId: lost.body.id,
        })
        .expect(201);
      await ctx
        .http()
        .post(`/contact-requests/${req.body.id}/respond`)
        .set(auth(stranger))
        .send({ action: 'ACCEPT', responseMessage: 'hi' })
        .expect(404);
      await ctx
        .http()
        .post(`/contact-requests/${req.body.id}/respond`)
        .set(auth(finder))
        .send({
          action: 'ACCEPT',
          responseMessage: 'Collect them at the bakery on Carrer Major',
        })
        .expect(200);
      const mine = await ctx
        .http()
        .get('/contact-requests/me')
        .set(auth(loser))
        .expect(200);
      expect(mine.body.outgoing[0]).toMatchObject({
        status: 'ACCEPTED',
        responseMessage: 'Collect them at the bakery on Carrer Major',
      });

      // Block: the stranger's request is blocked and they cannot ask again.
      const req2 = await ctx
        .http()
        .post(`/lost-found/${found.body.id}/contact-requests`)
        .set(auth(stranger))
        .send({ message: 'Give me your number right now' })
        .expect(201);
      await ctx
        .http()
        .post(`/contact-requests/${req2.body.id}/respond`)
        .set(auth(finder))
        .send({ action: 'BLOCK' })
        .expect(200);
      await ctx
        .http()
        .post(`/lost-found/${found.body.id}/contact-requests`)
        .set(auth(stranger))
        .send({ message: 'Please answer me now!!' })
        .expect(403);

      // Returned: closes the case and its matches.
      const resolved = await ctx
        .http()
        .patch(`/posts/${lost.body.id}/resolve`)
        .set(auth(loser))
        .send({})
        .expect(200);
      expect(resolved.body.lostFound.status).toBe('RETURNED');
      expect(
        (
          await ctx
            .http()
            .get(`/lost-found/${lost.body.id}/matches`)
            .set(auth(loser))
            .expect(200)
        ).body.closed,
      ).toBe(true);
    });
  });

  describe('account deletion', () => {
    it('requires confirmation, removes personal data and invalidates the session', async () => {
      const u = await registerUser(ctx, 'Leaving');
      await createPost(u, { title: 'My last post here' }).expect(201);
      await ctx.http().delete('/users/me').set(auth(u)).send({}).expect(400);
      await ctx
        .http()
        .delete('/users/me')
        .set(auth(u))
        .send({ confirm: 'DELETE' })
        .expect(200);
      await ctx.http().get('/users/me').set(auth(u)).expect(401);
      expect(await ctx.prisma.post.count({ where: { authorId: u.id } })).toBe(
        0,
      );
      const row = await ctx.prisma.user.findUnique({ where: { id: u.id } });
      expect(row!.email).not.toBe(u.email);
      await ctx
        .http()
        .post('/auth/login')
        .send({ email: u.email, password: u.password })
        .expect(401);
    });
  });

  describe('sockets', () => {
    let url: string;
    beforeAll(async () => {
      await ctx.app.listen(0);
      url = await ctx.app.getUrl();
      url = url.replace('[::1]', 'localhost');
    });
    const open = (token?: string) =>
      new Promise<Socket>((resolve) => {
        const s = connect(url, {
          transports: ['websocket'],
          auth: token ? { token } : {},
          forceNew: true,
        });
        s.on('connect', () => setTimeout(() => resolve(s), 200));
      });

    it("delivers a user's notifications only to that user's authenticated socket", async () => {
      const [owner, other] = [await registerUser(ctx), await registerUser(ctx)];
      const mine = await open(owner.token);
      const anon = await open();
      const theirs = await open(other.token);
      anon.emit('joinRoom', owner.id); // the old attack: must have no effect
      const got = { mine: 0, anon: 0, theirs: 0 };
      mine.on('notification', () => got.mine++);
      anon.on('notification', () => got.anon++);
      theirs.on('notification', () => got.theirs++);
      await new Promise((r) => setTimeout(r, 200));

      const commenter = await registerUser(ctx);
      const p = await createPost(owner, { title: 'Socket test post' }).expect(
        201,
      );
      await ctx
        .http()
        .post('/comments')
        .set(auth(commenter))
        .send({ postId: p.body.id, content: 'Nice!' })
        .expect(201);
      await new Promise((r) => setTimeout(r, 500));
      expect(got).toEqual({ mine: 1, anon: 0, theirs: 0 });
      [mine, anon, theirs].forEach((s) => s.close());
    });

    it('disconnects sockets presenting an invalid token', async () => {
      const s = connect(url, {
        transports: ['websocket'],
        auth: { token: 'forged.token.value' },
        forceNew: true,
      });
      const reason = await new Promise<string>((r) => s.on('disconnect', r));
      expect(reason).toBe('io server disconnect');
      s.close();
    });
  });
});
