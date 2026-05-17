const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function run() {
  try {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzEsImVtYWlsIjoic2luZ2hAcmFtLmNvbSIsIm5hbWUiOiJzaW5naCIsInJvbGVfaWQiOjUzLCJ0ZW5hbnRfaWQiOjEsImlhdCI6MTc3ODQ4NDk2MCwiZXhwIjoxNzc4NTcxMzYwLCJhdWQiOiJpbnZlbnRvcnktdXNlcnMiLCJpc3MiOiJpbnZlbnRvcnktc3lzdGVtIn0.P-0N-sAbOFvbFe-VVfmzzG_QKxUQplgK8KuHpdgy-tU";

    console.log("2. Uploading image...");
    const form = new FormData();
    form.append('name', 'singh');
    form.append('email', 'singh@ram.com');
    
    const imagePath = path.join(require('os').homedir(), 'Downloads', 'Screenshot 2026-05-09 171010.png');
    if (fs.existsSync(imagePath)) {
      form.append('profile_image', fs.createReadStream(imagePath));
    } else {
      console.log("Image not found:", imagePath);
      return;
    }

    const uploadRes = await fetch('https://api.giftgala.in/api/users/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...form.getHeaders()
      },
      body: form
    });

    const uploadText = await uploadRes.text();
    console.log('HTTP Status:', uploadRes.status);
    console.log('Response Body:', uploadText);

  } catch (e) {
    console.error(e);
  }
}

run();
