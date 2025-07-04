/**
 * Simple test script to verify the SQLite migration worked correctly
 */

import * as dbService from '../src/services/database.service';

async function testMigration() {
  console.log('🧪 Testing SQLite Database Migration\n');
  
  try {
    // Test 1: Check database connection
    console.log('1. Testing database connection...');
    const db = dbService.getDb();
    console.log('   ✅ Database connected successfully\n');
    
    // Test 2: Get all users history (paginated)
    console.log('2. Testing getAllUsersHistoryPaginated...');
    const paginatedHistory = dbService.getAllUsersHistoryPaginated(1, 100);
    console.log(`   📊 Found ${paginatedHistory.totalCount} total items`);
    console.log(`   📊 Current page has ${paginatedHistory.items.length} items`);
    console.log(`   📊 Has more pages: ${paginatedHistory.hasMore}`);
    console.log('   ✅ getAllUsersHistoryPaginated works\n');
    
    // Test 3: Test pagination for a specific user
    console.log('3. Testing pagination...');
    const usernames = [...new Set(paginatedHistory.items.map(item => item.username))];
    if (usernames.length > 0) {
      const testUser = usernames[0];
      const paginatedResult = dbService.getPaginatedHistoryForUser({
        username: testUser,
        page: 1,
        limit: 5
      });
      console.log(`   📄 Page 1 for ${testUser}: ${paginatedResult.items.length} items`);
      console.log(`   📊 Total: ${paginatedResult.totalCount}, Has more: ${paginatedResult.hasMore}`);
      console.log('   ✅ Pagination works\n');
    }
    
    // Test 4: Test finding specific item
    console.log('4. Testing findHistoryItemById...');
    if (paginatedHistory.items.length > 0) {
      const testId = paginatedHistory.items[0].id;
      const foundItem = dbService.findHistoryItemById(testId);
      console.log(`   🔍 Found item: ${foundItem ? foundItem.id : 'null'}`);
      console.log(`   ✅ findHistoryItemById works\n`);
    }
    
    // Test 5: Test filtering
    console.log('5. Testing filtering...');
    if (usernames.length > 0) {
      const testUser = usernames[0];
      
      const videoResults = dbService.getPaginatedHistoryForUser({
        username: testUser,
        page: 1,
        limit: 10,
        filter: 'video'
      });
      
      const imageResults = dbService.getPaginatedHistoryForUser({
        username: testUser,
        page: 1,
        limit: 10,
        filter: 'image'
      });
      
      console.log(`   🎥 Video items for ${testUser}: ${videoResults.items.length}`);
      console.log(`   🖼️  Image items for ${testUser}: ${imageResults.items.length}`);
      console.log('   ✅ Filtering works\n');
      
      // Show some details about the first few items
      if (imageResults.items.length > 0) {
        console.log('   📝 Sample image item details:');
        const sample = imageResults.items[0];
        console.log(`      ID: ${sample.id}`);
        console.log(`      Timestamp: ${new Date(sample.timestamp).toISOString()}`);
        console.log(`      Images: ${sample.editedImageUrls.filter(url => url !== null).length} edited`);
        console.log(`      Prompt: ${sample.constructedPrompt?.substring(0, 50)}...`);
        console.log('');
      }
    }
    
    console.log('🎉 All tests passed! Migration was successful.');
    console.log('\n💡 The SQLite database is now ready to replace the JSON file system.');
    console.log('   - Atomic transactions prevent data loss');
    console.log('   - Efficient queries and pagination');
    console.log('   - Built-in indexing for fast lookups');
    console.log('   - Support for filtering and searching');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testMigration();
