import axios from 'axios';

/**
 * Binotel Call Password Service
 * Документація: https://api.binotel.com/api/4.0/
 * 
 * Підтримує два методи верифікації:
 * 1. verification-by-call-with-cid - дзвінок з кодом у caller ID
 * 2. verification-by-sms - SMS з кодом
 */

interface BinotelConfig {
  key: string;
  secret: string;
  apiUrl: string;
}

interface CallPasswordResponse {
  success: boolean;
  status?: string;
  message?: string;
  code?: string;
}

interface VerificationCheckResponse {
  success: boolean;
  status?: string;
  message?: string;
}

export class BinotelService {
  private config: BinotelConfig;

  constructor() {
    this.config = {
      key: process.env.BINOTEL_KEY || '',
      secret: process.env.BINOTEL_SECRET || '',
      apiUrl: 'https://api.binotel.com/api/4.0',
    };

    if (!this.config.key || !this.config.secret) {
      console.warn('⚠️ Binotel credentials not configured. Call Password will not work!');
    } else {
      console.log('✅ Binotel Call Password configured');
    }
  }

  /**
   * Відправити дзвінок з кодом верифікації (Call Password)
   * Клієнт отримує дзвінок і має ввести останні 4 цифри номера
   * 
   * @param phone Номер телефону у форматі 380XXXXXXXXX (без +)
   * @param application Назва додатку (для розрізнення різних сервісів)
   * @param lifetime Час життя коду в хвилинах (за замовчуванням 10)
   * @param codeLength Довжина коду (за замовчуванням 4)
   * @returns Promise з результатом
   */
  async sendCallVerification(
    phone: string,
    application: string = 'NovaLoyalty',
    lifetime: number = 10,
    codeLength: number = 4
  ): Promise<CallPasswordResponse> {
    try {
      // Перевірка конфігурації
      if (!this.config.key || !this.config.secret) {
        console.error('❌ Binotel credentials missing');
        return {
          success: false,
          message: 'Binotel not configured',
        };
      }

      // Переконуємось що номер без + і в форматі E164
      const phoneNumberInE164 = phone.replace(/[^0-9]/g, '');

      console.log(`📞 Sending Call Password verification to ${phoneNumberInE164}`);
      console.log(`📱 Application: ${application}, Lifetime: ${lifetime}min, Code length: ${codeLength}`);

      const payload = {
        key: this.config.key,
        secret: this.config.secret,
        phoneNumberInE164,
        application,
        lifetime: lifetime.toString(),
        codeLength: codeLength.toString(),
      };

      console.log('📤 Request URL:', `${this.config.apiUrl}/callpassword/verification-by-call-with-cid.json`);
      console.log('📤 Request payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(
        `${this.config.apiUrl}/callpassword/verification-by-call-with-cid.json`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000, // 15 секунд таймаут
        }
      );

      console.log('📥 Binotel response status:', response.status);
      console.log('📥 Binotel response:', JSON.stringify(response.data, null, 2));

      if (response.data.status === 'success') {
        console.log(`✅ Call Password verification sent successfully to ${phone}`);
        return {
          success: true,
          status: response.data.status,
          message: response.data.message || 'Verification call sent',
        };
      } else {
        console.error(`❌ Binotel error:`, response.data);
        return {
          success: false,
          status: response.data.status,
          message: response.data.message || 'Call Password failed',
        };
      }
    } catch (error: any) {
      console.error('❌ Call Password error:', error.response?.data || error.message);
      console.error('❌ Full error:', JSON.stringify({
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      }, null, 2));
      
      return {
        success: false,
        message: error.response?.data?.message || error.response?.data || error.message || 'Network error',
      };
    }
  }

  /**
   * Відправити SMS з кодом верифікації
   * 
   * @param phone Номер телефону у форматі 380XXXXXXXXX (без +)
   * @param application Назва додатку
   * @param senderId Ім'я відправника SMS
   * @param lifetime Час життя коду в хвилинах (за замовчуванням 10)
   * @param codeLength Довжина коду (за замовчуванням 4)
   * @returns Promise з результатом
   */
  async sendSmsVerification(
    phone: string,
    application: string = 'NovaLoyalty',
    senderId: string = 'NovaSyla',
    lifetime: number = 10,
    codeLength: number = 4
  ): Promise<CallPasswordResponse> {
    try {
      if (!this.config.key || !this.config.secret) {
        console.error('❌ Binotel credentials missing');
        return {
          success: false,
          message: 'Binotel not configured',
        };
      }

      const phoneNumberInE164 = phone.replace(/[^0-9]/g, '');

      console.log(`📲 Sending SMS verification to ${phoneNumberInE164}`);

      const payload = {
        key: this.config.key,
        secret: this.config.secret,
        phoneNumberInE164,
        senderId,
        lifetime: lifetime.toString(),
        application,
        codeLength: codeLength.toString(),
      };

      const response = await axios.post(
        `${this.config.apiUrl}/callpassword/verification-by-sms.json`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      console.log('📥 Binotel SMS response:', response.data);

      if (response.data.status === 'success') {
        console.log(`✅ SMS verification sent successfully to ${phone}`);
        return {
          success: true,
          status: response.data.status,
          message: response.data.message || 'SMS sent',
        };
      } else {
        console.error(`❌ Binotel SMS error:`, response.data);
        return {
          success: false,
          status: response.data.status,
          message: response.data.message || 'SMS sending failed',
        };
      }
    } catch (error: any) {
      console.error('❌ SMS verification error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Network error',
      };
    }
  }

  /**
   * Перевірити код верифікації, введений користувачем
   * 
   * @param phone Номер телефону у форматі 380XXXXXXXXX (без +)
   * @param code Код, який ввів користувач (4 цифри)
   * @param application Назва додатку (має співпадати з тією, що була при відправці)
   * @returns Promise з результатом перевірки
   */
  async checkVerificationCode(
    phone: string,
    code: string,
    application: string = 'NovaLoyalty'
  ): Promise<VerificationCheckResponse> {
    try {
      if (!this.config.key || !this.config.secret) {
        console.error('❌ Binotel credentials missing');
        return {
          success: false,
          message: 'Binotel not configured',
        };
      }

      const phoneNumberInE164 = phone.replace(/[^0-9]/g, '');

      console.log(`🔍 Checking verification code for ${phoneNumberInE164}: ${code}`);

      const payload = {
        key: this.config.key,
        secret: this.config.secret,
        phoneNumberInE164,
        code,
        application,
      };

      const response = await axios.post(
        `${this.config.apiUrl}/callpassword/checking-verification-code.json`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      console.log('📥 Code verification response:', response.data);

      if (response.data.status === 'success') {
        console.log(`✅ Code verified successfully for ${phone}`);
        return {
          success: true,
          status: response.data.status,
          message: response.data.message || 'Successfully verified code',
        };
      } else {
        console.log(`❌ Invalid code for ${phone}`);
        return {
          success: false,
          status: response.data.status || 'failed',
          message: response.data.message || 'Bad verification code',
        };
      }
    } catch (error: any) {
      console.error('❌ Code verification error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Network error',
      };
    }
  }

  /**
   * Генерація випадкового 4-значного коду (для резервного використання)
   * Зверніть увагу: Call Password API генерує код автоматично
   */
  generateCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }
}

export default new BinotelService();
