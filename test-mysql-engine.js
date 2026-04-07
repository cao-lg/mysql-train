// 测试 MySQL 引擎
import mysqlEngine from './js/mysql-wasm-engine.js';

async function testMySQL() {
    console.log('测试 MySQL 引擎...');
    
    // 测试 CREATE DATABASE 语句
    console.log('\n1. 测试 CREATE DATABASE student;');
    const result1 = await mysqlEngine.execute('CREATE DATABASE student;');
    console.log('结果:', result1);
    
    // 测试 SHOW DATABASES 语句
    console.log('\n2. 测试 SHOW DATABASES;');
    const result2 = await mysqlEngine.execute('SHOW DATABASES;');
    console.log('结果:', result2);
    
    // 测试 SELECT 语句
    console.log('\n3. 测试 SELECT * FROM users;');
    const result3 = await mysqlEngine.execute('SELECT * FROM users;');
    console.log('结果:', result3);
    
    // 测试其他语句
    console.log('\n4. 测试 SELECT * FROM students;');
    const result4 = await mysqlEngine.execute('SELECT * FROM students;');
    console.log('结果:', result4);
}

testMySQL().catch(console.error);
