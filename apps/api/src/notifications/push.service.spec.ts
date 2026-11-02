import {
  PushService,
  RECEIPT_DELAY_MS,
  RECEIPT_MAX_AGE_MS,
} from './push.service';
import { resetAppConfig } from '../common/env';

const TOKEN_A = 'ExponentPushToken[aaaa]';
const TOKEN_B = 'ExponentPushToken[bbbb]';

function json(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status }));
}

describe('PushService delivery', () => {
  let prisma: any;
  let service: PushService;
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    process.env.PUSH_PROVIDER = 'expo';
    resetAppConfig();
    prisma = {
      deviceToken: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ token: TOKEN_A }, { token: TOKEN_B }]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    service = new PushService(prisma);
    fetchMock = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchMock.mockRestore();
    delete process.env.PUSH_PROVIDER;
    resetAppConfig();
  });

  it('does nothing when push is not configured', async () => {
    delete process.env.PUSH_PROVIDER;
    resetAppConfig();
    expect(await service.sendToUsers(['u1'], { title: 't', body: 'b' })).toBe(
      0,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('counts accepted tickets, revokes DeviceNotRegistered tokens and queues receipts', async () => {
    fetchMock.mockReturnValueOnce(
      json({
        data: [
          { status: 'ok', id: 'ticket-a' },
          { status: 'error', details: { error: 'DeviceNotRegistered' } },
        ],
      }),
    );
    expect(await service.sendToUsers(['u1'], { title: 't', body: 'b' })).toBe(
      1,
    );
    expect(prisma.deviceToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ token: { in: [TOKEN_B] } }),
      }),
    );
    expect(service.pendingReceipts).toBe(1);
  });

  it('checks receipts only after the delay and revokes tokens Expo reports as uninstalled', async () => {
    const sentAt = Date.now();
    fetchMock.mockReturnValueOnce(
      json({
        data: [
          { status: 'ok', id: 'ticket-a' },
          { status: 'ok', id: 'ticket-b' },
        ],
      }),
    );
    await service.sendToUsers(['u1'], { title: 't', body: 'b' });
    prisma.deviceToken.updateMany.mockClear();

    expect(await service.checkReceipts(sentAt + 60_000)).toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(1); // too early: no receipts request

    fetchMock.mockReturnValueOnce(
      json({
        data: {
          'ticket-a': { status: 'ok' },
          'ticket-b': {
            status: 'error',
            details: { error: 'DeviceNotRegistered' },
          },
        },
      }),
    );
    expect(await service.checkReceipts(sentAt + RECEIPT_DELAY_MS + 1000)).toBe(
      1,
    );
    expect(prisma.deviceToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ token: { in: [TOKEN_B] } }),
      }),
    );
    expect(service.pendingReceipts).toBe(0);
  });

  it('keeps receipts that are not ready or whose request failed, and drops expired ones', async () => {
    const sentAt = Date.now();
    fetchMock.mockReturnValueOnce(
      json({
        data: [
          { status: 'ok', id: 'ticket-a' },
          { status: 'ok', id: 'ticket-b' },
        ],
      }),
    );
    await service.sendToUsers(['u1'], { title: 't', body: 'b' });

    fetchMock.mockReturnValueOnce(json({ error: 'busy' }, 503));
    await service.checkReceipts(sentAt + RECEIPT_DELAY_MS + 1000);
    expect(service.pendingReceipts).toBe(2);

    fetchMock.mockReturnValueOnce(
      json({ data: { 'ticket-a': { status: 'ok' } } }),
    );
    await service.checkReceipts(sentAt + RECEIPT_DELAY_MS + 2000);
    expect(service.pendingReceipts).toBe(1);

    await service.checkReceipts(sentAt + RECEIPT_MAX_AGE_MS + 1000);
    expect(service.pendingReceipts).toBe(0);
  });
});
