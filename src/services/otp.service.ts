/**
 * OTP (One-Time Password) Service
 * Зберігання кодів верифікації в пам'яті з TTL
 */

interface OTPEntry {
  code: string;
  phone: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
}

export class OTPService {
  private storage: Map<string, OTPEntry>;
  private readonly TTL = 2 * 60 * 1000; // 2 хвилини
  private readonly MAX_ATTEMPTS = 3; // Максимум 3 спроби

  constructor() {
    this.storage = new Map();
    
    // Автоматичне очищення прострочених кодів кожну хвилину
    setInterval(() => {
      this.cleanupExpired();
    }, 60 * 1000);
  }

  /**
   * Зберегти новий OTP код
   */
  saveCode(phone: string, code: string): void {
    const now = Date.now();
    
    this.storage.set(phone, {
      code,
      phone,
      createdAt: now,
      expiresAt: now + this.TTL,
      attempts: 0,
    });

    console.log(`📝 OTP saved for ${phone}: ${code} (expires in ${this.TTL / 1000}s)`);
  }

  /**
   * Перевірити OTP код
   */
  verifyCode(phone: string, code: string): {
    valid: boolean;
    reason?: string;
  } {
    const entry = this.storage.get(phone);

    if (!entry) {
      console.log(`❌ OTP not found for ${phone}`);
      return {
        valid: false,
        reason: 'CODE_NOT_FOUND',
      };
    }

    // Перевірка терміну дії
    if (Date.now() > entry.expiresAt) {
      console.log(`⏰ OTP expired for ${phone}`);
      this.storage.delete(phone);
      return {
        valid: false,
        reason: 'CODE_EXPIRED',
      };
    }

    // Перевірка кількості спроб
    if (entry.attempts >= this.MAX_ATTEMPTS) {
      console.log(`🚫 Too many attempts for ${phone}`);
      this.storage.delete(phone);
      return {
        valid: false,
        reason: 'TOO_MANY_ATTEMPTS',
      };
    }

    // Збільшуємо лічильник спроб
    entry.attempts += 1;

    // Перевірка коду
    if (entry.code === code) {
      console.log(`✅ OTP verified successfully for ${phone}`);
      this.storage.delete(phone); // Видаляємо після успішної перевірки
      return {
        valid: true,
      };
    } else {
      console.log(`❌ Invalid OTP for ${phone} (attempt ${entry.attempts}/${this.MAX_ATTEMPTS})`);
      return {
        valid: false,
        reason: 'INVALID_CODE',
      };
    }
  }

  /**
   * Отримати код (для дебагу, не використовувати в продакшні!)
   */
  getCode(phone: string): string | null {
    const entry = this.storage.get(phone);
    return entry ? entry.code : null;
  }

  /**
   * Видалити код
   */
  deleteCode(phone: string): void {
    this.storage.delete(phone);
    console.log(`🗑️ OTP deleted for ${phone}`);
  }

  /**
   * Очистити код (аліас для deleteCode, для зручності)
   */
  clearCode(phone: string): void {
    this.deleteCode(phone);
  }

  /**
   * Перевірити чи існує активний код
   */
  hasActiveCode(phone: string): boolean {
    const entry = this.storage.get(phone);
    
    if (!entry) {
      return false;
    }

    // Перевірка терміну дії
    if (Date.now() > entry.expiresAt) {
      this.storage.delete(phone);
      return false;
    }

    return true;
  }

  /**
   * Отримати залишковий час до закінчення коду (в секундах)
   */
  getTimeLeft(phone: string): number {
    const entry = this.storage.get(phone);
    
    if (!entry) {
      return 0;
    }

    const timeLeft = Math.max(0, entry.expiresAt - Date.now());
    return Math.floor(timeLeft / 1000);
  }

  /**
   * Очищення прострочених кодів
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [phone, entry] of this.storage.entries()) {
      if (now > entry.expiresAt) {
        this.storage.delete(phone);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired OTP codes`);
    }
  }

  /**
   * Статистика (для моніторингу)
   */
  getStats(): {
    total: number;
    active: number;
  } {
    const now = Date.now();
    let active = 0;

    for (const entry of this.storage.values()) {
      if (now <= entry.expiresAt) {
        active++;
      }
    }

    return {
      total: this.storage.size,
      active,
    };
  }
}

export default new OTPService();
