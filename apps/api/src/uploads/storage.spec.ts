import { createStorage, LocalDiskStorage, S3Storage } from './storage';

describe('storage selection', () => {
  it('uses local disk by default and S3 when configured', () => {
    expect(createStorage({ provider: 'local' }, './uploads')).toBeInstanceOf(
      LocalDiskStorage,
    );
    expect(
      createStorage(
        {
          provider: 's3',
          endpoint: 'http://localhost:9090',
          region: 'auto',
          bucket: 'b',
          accessKeyId: 'k',
          secretAccessKey: 's',
          publicUrl: 'https://media.example.com',
          forcePathStyle: true,
        },
        './uploads',
      ),
    ).toBeInstanceOf(S3Storage);
  });

  it('S3 storage only deletes objects under its own public URL', async () => {
    const sent: unknown[] = [];
    const client = {
      send: (cmd: unknown) => (sent.push(cmd), Promise.resolve({})),
    } as never;
    const s3 = new S3Storage(
      {
        provider: 's3',
        endpoint: null,
        region: 'auto',
        bucket: 'b',
        accessKeyId: 'k',
        secretAccessKey: 's',
        publicUrl: 'https://media.example.com',
        forcePathStyle: false,
      },
      client,
    );
    await s3.remove('/uploads/legacy.png');
    await s3.remove('https://evil.example.com/uploads/abc.png');
    expect(sent).toHaveLength(0);
    await s3.remove(
      'https://media.example.com/uploads/0f8fad5b-d9cb-469f-a165-70867728950e.png',
    );
    expect(sent).toHaveLength(1);
  });
});
