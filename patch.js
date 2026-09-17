const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

const insertMatch = code.match(/const farmerId =\s*generateFarmerId\(\);\s*await query\([\s\S]*?\]\s*\);/);
if (insertMatch) {
  const insertBlock = insertMatch[0];
  const updateBlock = 

        // Post-insert Aadhaar fields
        if (body.aadhaar_number) {
          await query('UPDATE farmers SET aadhaar_number = , kyc_verified =  WHERE id = ', [body.aadhaar_number, body.kyc_verified || false, farmerId]);
        };
  
  code = code.replace(insertBlock, insertBlock + updateBlock);
  fs.writeFileSync('server/server.js', code);
  console.log('Successfully patched server.js for Farmer Registration!');
} else {
  console.log('Could not find insert block');
}
