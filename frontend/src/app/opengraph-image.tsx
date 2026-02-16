import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'VibeCheck — AI Token Safety Scanner';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <span style={{ fontSize: '72px' }}>🔍</span>
          <span
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              background: 'linear-gradient(90deg, #4ade80, #10b981)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            VibeCheck
          </span>
        </div>
        <p style={{ fontSize: '32px', color: '#a1a1aa', margin: '0', textAlign: 'center' }}>
          AI Token Safety Scanner for BNB Smart Chain
        </p>
        <div
          style={{
            marginTop: '40px',
            width: '200px',
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
