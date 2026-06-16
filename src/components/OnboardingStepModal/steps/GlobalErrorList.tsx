import React from 'react';
import { Form } from 'antd';
import styles from '../styles.module.scss';

export const GlobalErrorList: React.FC<{ form: any }> = ({ form }) => {
  return (
    <Form.Item shouldUpdate className={styles.globalErrorItem}>
      {() => {
        const errors = form.getFieldsError().flatMap((field: any) => field.errors || []);
        const uniqueErrors = Array.from(new Set(errors));
        
        if (uniqueErrors.length === 0) return null;
        
        return (
          <div className={styles.globalErrorContainer}>
            {uniqueErrors.map((error, index) => (
              <div key={index} className={styles.globalErrorText}>
                {error as React.ReactNode}
              </div>
            ))}
          </div>
        );
      }}
    </Form.Item>
  );
};
