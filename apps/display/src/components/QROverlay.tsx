import { QRCodeSVG } from 'qrcode.react';

const REGISTER_URL = import.meta.env.VITE_REGISTER_URL || 'https://go.activacom.mx';

interface QROverlayProps {
  eventCode: string;
}

export function QROverlay({ eventCode }: QROverlayProps) {
  const url = `${REGISTER_URL}/e/${eventCode}`;

  return (
    <div className="absolute right-8 bottom-8 flex flex-col items-center gap-3 rounded-2xl bg-white/95 p-5 shadow-2xl backdrop-blur-sm">
      <QRCodeSVG
        value={url}
        size={200}
        level="M"
        bgColor="transparent"
      />
      <p className="text-sm font-semibold text-gray-700">
        Escanea para participar
      </p>
    </div>
  );
}
