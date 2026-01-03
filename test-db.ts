import { getConnection, closeConnection } from './src/config/database';

async function testConnection() {
  console.log('🔌 Testing database connection...');
  
  try {
    const pool = await getConnection();
    console.log('✅ Connected to SQL Server successfully!');
    
    // Тест простого запиту
    const result = await pool.request().query('SELECT @@VERSION as version');
    console.log('📊 SQL Server version:', result.recordset[0].version);
    
    // Тест виклику процедури
    console.log('\n🔄 Testing zeus_GetCli procedure...');
    const clientResult = await pool
      .request()
      .input('PhoneNum', '+380685552629')
      .execute('AZIT.dbo.zeus_GetCli');
    
    if (clientResult.recordset && clientResult.recordset.length > 0) {
      console.log('✅ Procedure executed successfully!');
      console.log('📋 Result:', JSON.stringify(clientResult.recordset[0], null, 2));
    } else {
      console.log('⚠️ No records found for this phone number');
    }
    
    await closeConnection();
    console.log('\n✅ All tests passed!');
  } catch (error: any) {
    console.error('❌ Connection error:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

testConnection();
