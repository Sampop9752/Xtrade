const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Create or load Excel workbook
const workbook = new ExcelJS.Workbook();
const filePath = path.join(__dirname, 'leads.xlsx');

(async () => {
  if (fs.existsSync(filePath)) {
    await workbook.xlsx.readFile(filePath);
  } else {
    const sheet = workbook.addWorksheet('Leads');
    sheet.columns = [
      { header: 'Name', key: 'name' },
      { header: 'Email', key: 'email' },
      { header: 'Phone', key: 'phone' },
      { header: 'Country', key: 'country' },
      { header: 'Age', key: 'age' },
      { header: 'Arabic', key: 'arabic' },
      { header: 'Trading Interest', key: 'tradingInterest' },
      { header: 'userIp', key: 'userIp' },
      { header: 'Affiliate Token', key: 'affiliateToken' },
    ];
    await workbook.xlsx.writeFile(filePath);
  }
})();

app.post('/submit', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      country,
      age,
      arabic,
      tradingInterest,
      affiliateToken,
    } = req.body;

    // ✅ Get userIp from request
    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    console.log('User IP:', userIp);

    const worksheet = workbook.getWorksheet('Leads');

    worksheet.addRow({
      name,
      email,
      phone,
      country,
      age,
      arabic,
      tradingInterest,
      userIp: userIp, // ✅ Save the actual IP here
      affiliateToken,
    });

    await workbook.xlsx.writeFile(filePath);
    res.status(200).send('Lead saved successfully!');
  } catch (error) {
    console.error('Error saving lead:', error);
    res.status(500).send('Error saving lead');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});