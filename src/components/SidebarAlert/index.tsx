import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ShoppingOutlined, WarningOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './styles.module.scss';

interface SidebarAlertProps {
  balance: {
    real_spending: number;
    planned_spending: number;
  };
  visible: boolean;
}

const SidebarAlert: React.FC<SidebarAlertProps> = ({ balance, visible }) => {
  const [hasAnimated, setHasAnimated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!sessionStorage.getItem('sidebar_alert_animated');
    }
    return false;
  });

  useEffect(() => {
    if (!hasAnimated) {
      sessionStorage.setItem('sidebar_alert_animated', 'true');
    }
  }, [hasAnimated]);

  const spentPercentage = (balance.real_spending / balance.planned_spending) * 100 || 0;
  
  let status: 'success' | 'attention' | 'dangerous' = 'success';
  let messageText = 'Seu orçamento está sob controle. Continue assim!';
  let titleText = 'Tudo certo';
  let img = '/sucess.png';
  let color = '#31B63B';

  if (balance.planned_spending > 0) {
    if (spentPercentage >= 90) {
      status = 'dangerous';
      titleText = 'Perigo';
      messageText = `Cuidado! Você já consumiu ${spentPercentage.toFixed(0)}% do seu orçamento.`;
      img = '/dangerous.png';
      color = '#FF4D4F';
    } else if (spentPercentage >= 70) {
      status = 'attention';
      titleText = 'Atenção';
      messageText = `Você gastou ${spentPercentage.toFixed(0)}% do seu orçamento planejado para este mês.`;
      img = '/attention.png';
      color = '#FF754C';
    }
  } else if (balance.real_spending > 0) {
    // Caso tenha gastos mas não tenha meta definida
    status = 'attention';
    titleText = 'Sem Meta';
    messageText = `Você ainda não definiu uma meta de gastos para este mês.`;
    img = '/attention.png';
    color = '#FF754C';
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={hasAnimated ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={styles.sidebarAlert}
          style={{ background: `${color}0D`, border: `1px solid ${color}26` }}
        >
          <div className={styles.illustrationWrapper}>
            <Image src={img} alt={titleText} width={100} height={100} className={styles.illustration} />
          </div>
          <div className={styles.content}>
            <div className={styles.header} style={{ color }}>
              {status === 'success' ? <ShoppingOutlined /> : <WarningOutlined />}
              <span>{titleText}</span>
            </div>
            <p className={styles.message}>{messageText}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SidebarAlert;
