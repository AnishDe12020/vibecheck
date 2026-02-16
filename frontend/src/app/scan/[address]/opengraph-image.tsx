import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'VibeCheck Token Scan';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0a0f',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <span style={{ fontSize: '48px' }}>🔍</span>
          <span
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              background: 'linear-gradient(90deg, #4ade80, #10b981)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            VibeCheck
          </span>
        </div>
        <p style={{ fontSize: '36px', color: '#e4e4e7', margin: '0 0 8px 0', fontFamily: 'monospace' }}>
          {short}
        </p>
        <p style={{ fontSize: '24px', color: '#71717a', margin: '0' }}>
          Scan this token on VibeCheck
        </p>
        <div
          style={{
            marginTop: '40px',
            width: '160px',
            height: '4px',
            background: 'linear-gradient(90deg, #4ade80, #10b981)',
            borderRadius: '2px',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
