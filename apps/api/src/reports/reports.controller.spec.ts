import { ReportsController } from './reports.controller';

describe('ReportsController', () => {
  it('uses the authenticated user as reporter, never a client-supplied id', async () => {
    const service: any = { create: jest.fn().mockResolvedValue({}) };
    const controller = new ReportsController(service);
    await controller.create(
      { postId: 'p', reason: 'SPAM', reporterId: 'forged' } as any,
      { id: 'me' } as any,
    );
    expect(service.create).toHaveBeenCalledWith(expect.anything(), 'me');
  });
});
