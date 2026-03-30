import { Col, Row } from "antd";
import Typography from "antd/es/typography";
import dayjs from "dayjs";
import Image from "next/image";
import { motion } from "framer-motion";
import AnimatedNumber from "@/components/AnimatedNumber";

interface Card {
  best_day: number;
  created_at: Date;
  card_description: string;
  expiration: number;
  flag_id: number;
  id: number;
  updated_at: Date;
  user_id: number;
}

interface CardProps {
  card: Card;
  totalValue?: number;
}
export const CardInformation = ({ card, totalValue }: CardProps) => {
  const { Text, Title } = Typography;

  const formatCurrency = (value: any): string => {
    const numValue = parseFloat(value || 0);
    return numValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const getFlagColor = (flagId: number) => {
    const colors: { [key: number]: string } = {
      3: 'linear-gradient(135deg, #1e1e1e 0%, #3a3a3a 100%)', // Mastercard (Dark)
      4: 'linear-gradient(135deg, #1a1f71 0%, #0056b3 100%)', // Visa (Blue)
      5: 'linear-gradient(135deg, #d32f2f 0%, #ff5252 100%)', // Hipercard (Red)
      6: 'linear-gradient(135deg, #2d3e50 0%, #4c5c6e 100%)', // Elo (Grey/Dark Blue)
      7: 'linear-gradient(135deg, #00875a 0%, #22a06b 100%)', // Alelo (Green)
      8: 'linear-gradient(135deg, #007bc1 0%, #00b0ff 100%)', // Amex (Light Blue)
      9: 'linear-gradient(135deg, #004a97 0%, #0074e4 100%)', // Diners (Blue/Navy)
    };
    return colors[flagId] || 'linear-gradient(135deg, #6C5DD3 0%, #8E82EF 100%)';
  };

  const getFlagImage = (flagId: number) => {
    const images: { [key: number]: string } = {
      3: '/mastercard.png',
      4: '/visa.png',
      5: '/hipercard.png',
      6: '/elo.png',
      7: '/alelo.png',
      8: '/amex.png',
      9: '/diners.png',
    };
    return images[flagId] || '/mastercard.png';
  };

  const showDate = (date: number) => {
    if (date < dayjs().date()) {
      return dayjs().month() + 2;
    }
    return dayjs().month() + 1;
  };

  return (
    <div
      style={{ padding: '0' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          aspectRatio: '8/3.5',
          background: getFlagColor(card.flag_id),
          borderRadius: 12,
          padding: '24px',
          color: '#fff',
          boxShadow: '0px 15px 35px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Wave decoration */}
        <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '-25%', left: '-25%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.03)', zIndex: 0 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 2, fontWeight: 600 }}>{card.card_description}</div>
            <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.7)', marginBottom: 0 }}>Fatura</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
              <AnimatedNumber value={totalValue || 0} duration={1500} format={formatCurrency} />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Image src={getFlagImage(card.flag_id)} alt="Flag" width={36} height={22} style={{ objectFit: 'contain' }} />
            {card.flag_id === 3 && (
                <div style={{ fontSize: 8, color: '#fff', marginTop: 1, opacity: 0.9, fontWeight: 500, textTransform: 'lowercase' }}>mastercard</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 14, letterSpacing: 3, color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
            **** **** **** ****
          </div>
          <div>
            <div style={{ fontSize: 9, color: 'rgba(255, 255, 255, 0.7)', textAlign: 'right' }}>Vencimento</div>
            <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>
              {String(card.expiration).padStart(2, '0')}/
              {String(showDate(card.expiration)).padStart(2, '0')}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
