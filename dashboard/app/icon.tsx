import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
          borderRadius: 6,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            background: '#0a0d12',
            borderRadius: 2,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
