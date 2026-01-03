// Mock database для тестування Railway deployment без локальної бази
const mockClients = [
  {
    RECID: 1,
    NAME: 'Тестовий Клієнт',
    F7: '+380679175108',
    BonusAccount: 150,
    TotalPurchases: 5,
    LastVisit: new Date('2025-12-30')
  },
  {
    RECID: 2,
    NAME: 'Іван Петренко',
    F7: '+380679508133',
    BonusAccount: 85,
    TotalPurchases: 3,
    LastVisit: new Date('2025-12-28')
  }
];

class MockDatabase {
  async connect() {
    console.log('📦 Using MOCK database (no real DB connection)');
    return true;
  }

  async query(sql: string): Promise<any> {
    console.log('🔍 Mock query:', sql);
    
    // Simulate zeus_GetCli procedure
    if (sql.includes('zeus_GetCli') || sql.includes('Clients')) {
      const phoneMatch = sql.match(/[+]?380\d{9}/);
      if (phoneMatch) {
        const phone = phoneMatch[0];
        const client = mockClients.find(c => c.F7 === phone);
        if (client) {
          return { recordset: [client] };
        }
      }
      return { recordset: [] };
    }

    // Default response
    return { recordset: [], rowsAffected: [0] };
  }

  async close() {
    console.log('📦 Mock database closed');
  }
}

module.exports = { MockDatabase, mockClients };
