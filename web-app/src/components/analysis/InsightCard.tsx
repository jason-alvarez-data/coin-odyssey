import React from 'react';

interface InsightCardProps {
  type: 'success' | 'warning' | 'info' | 'neutral';
  title: string;
  message: string;
  icon: string;
}

const typeStyles = {
  success: {
    background: 'bg-green-500/10',
    border: 'border-green-500/30',
    iconBg: 'bg-green-500/20',
    titleColor: 'text-green-400',
    messageColor: 'text-green-200'
  },
  warning: {
    background: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    iconBg: 'bg-yellow-500/20',
    titleColor: 'text-yellow-400',
    messageColor: 'text-yellow-200'
  },
  info: {
    background: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    iconBg: 'bg-blue-500/20',
    titleColor: 'text-blue-400',
    messageColor: 'text-blue-200'
  },
  neutral: {
    background: 'bg-gray-500/10',
    border: 'border-gray-500/30',
    iconBg: 'bg-gray-500/20',
    titleColor: 'text-gray-400',
    messageColor: 'text-gray-200'
  }
};

const InsightCard: React.FC<InsightCardProps> = ({ type, title, message, icon }) => {
  const styles = typeStyles[type];

  return (
    <div className={`
      ${styles.background} ${styles.border} 
      border rounded-xl p-4 
      hover:scale-[1.02] transition-transform duration-200
      relative overflow-hidden
    `}>
      <div className="flex items-start space-x-3">
        <div className={`
          ${styles.iconBg} 
          w-10 h-10 rounded-lg flex items-center justify-center
          flex-shrink-0
        `}>
          <span className="text-lg">{icon}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={`${styles.titleColor} font-semibold text-sm mb-1`}>
            {title}
          </h4>
          <p className={`${styles.messageColor} text-sm leading-relaxed`}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InsightCard; 