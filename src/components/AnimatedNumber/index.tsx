"use client";
import React, { useState, useEffect, useRef } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: (val: number) => string;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ 
  value, 
  duration = 1000, 
  format = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef(0);

  useEffect(() => {
    const targetValue = value || 0;
    
    // Reset animation when value changes
    startTimeRef.current = null;
    startValueRef.current = displayValue;

    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = timestamp - startTimeRef.current;
      const percentage = Math.min(progress / duration, 1);
      
      // Easing function: easeOutExpo
      const easing = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      
      const nextValue = startValueRef.current + (targetValue - startValueRef.current) * easing;
      setDisplayValue(nextValue);

      if (percentage < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  return <span>{format(displayValue)}</span>;
};

export default AnimatedNumber;
