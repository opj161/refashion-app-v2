// Image naming migration verification script
const fs = require('fs');
const path = require('path');

const uploadsDir = './public/uploads';
const generatedImagesDir = path.join(uploadsDir, 'generated_images');
const userUploadedDir = path.join(uploadsDir, 'user_uploaded_clothing');

console.log('🔍 Verifying RefashionAI image naming migration...\n');

// Check generated images
if (fs.existsSync(generatedImagesDir)) {
  const generatedFiles = fs.readdirSync(generatedImagesDir);
  const generatedWithOldPrefix = generatedFiles.filter(file => file.startsWith('imageforge_'));
  const generatedWithNewPrefix = generatedFiles.filter(file => file.startsWith('RefashionAI_generated_'));

  console.log(`📁 Generated Images Directory:`);
  console.log(`   ✅ Files with new prefix (RefashionAI_generated_): ${generatedWithNewPrefix.length}`);
  console.log(`   ❌ Files with old prefix (imageforge_): ${generatedWithOldPrefix.length}`);

  if (generatedWithOldPrefix.length > 0) {
    console.log(`   ⚠️  Old files found: ${generatedWithOldPrefix.slice(0, 3).join(', ')}${generatedWithOldPrefix.length > 3 ? '...' : ''}`);
  }
} else {
  console.log(`📁 Generated Images Directory: Not found`);
}

// Check user uploaded files
if (fs.existsSync(userUploadedDir)) {
  const userFiles = fs.readdirSync(userUploadedDir);
  const userWithOldPrefix = userFiles.filter(file => file.startsWith('user_clothing_item_'));
  const userWithNewPrefix = userFiles.filter(file => file.startsWith('RefashionAI_userclothing_'));

  console.log(`\n📁 User Uploaded Directory:`);
  console.log(`   ✅ Files with new prefix (RefashionAI_userclothing_): ${userWithNewPrefix.length}`);
  console.log(`   ❌ Files with old prefix (user_clothing_item_): ${userWithOldPrefix.length}`);

  if (userWithOldPrefix.length > 0) {
    console.log(`   ⚠️  Old files found: ${userWithOldPrefix.slice(0, 3).join(', ')}${userWithOldPrefix.length > 3 ? '...' : ''}`);
  }
} else {
  console.log(`\n📁 User Uploaded Directory: Not found`);
}

// Check history files
const historyDir = './user_data/history';
if (fs.existsSync(historyDir)) {
  const historyFiles = fs.readdirSync(historyDir).filter(f => f.endsWith('.json'));
  console.log(`\n📁 History Files: ${historyFiles.length} found`);
  
  let updatedHistoryCount = 0;
  let oldReferencesCount = 0;
  
  for (const file of historyFiles) {
    const content = fs.readFileSync(path.join(historyDir, file), 'utf8');
    if (content.includes('RefashionAI_generated') || content.includes('RefashionAI_userclothing')) {
      updatedHistoryCount++;
    }
    if (content.includes('imageforge_generated') || content.includes('user_clothing_item_')) {
      oldReferencesCount++;
    }
  }
  
  console.log(`   ✅ History files with updated references: ${updatedHistoryCount}`);
  console.log(`   ❌ History files with old references: ${oldReferencesCount}`);
} else {
  console.log(`\n📁 History Directory: Not found`);
}

console.log('\n✅ RefashionAI naming migration verification complete!');
console.log('\n🎯 Next steps:');
console.log('1. Test the application at http://localhost:9002');
console.log('2. Verify that existing images in history load correctly');
console.log('3. Test new image generation to ensure new naming scheme works');
console.log('4. If issues found, restore from backup in backups/ directory');
