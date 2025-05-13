const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const app = express();
const PORT = 3000;
const LEADS_FILE = path.join(__dirname, 'leads.xlsx');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const XTRADE_API_URL = 'https://www.xtrade.com/api/lead/create';

// Initialize Excel file if it doesn't exist
try {
  if (!fs.existsSync(LEADS_FILE)) {
    console.log('Initializing Excel file...');
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet([]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
    XLSX.writeFile(workbook, LEADS_FILE);
    console.log('Excel file created successfully.');
  }
} catch (error) {
  console.error('Error initializing Excel file:', error);
}

app.post('/api/lead/create', async (req, res) => {
  try {
    const {
      userIp,
      email,
      fullName,
      countryCodeISO2,
      phoneCountryCode,
      phoneAreaCode,
      phoneNumber,
      emailOpt,
      language,
      affTrack,
      affToken,
      affTags,
    } = req.body;

    // Validate required fields
    if (!email || !fullName || !countryCodeISO2 || !phoneCountryCode || !phoneNumber || !language || !affTrack || !affToken) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Prepare data for API
    const requestBody = new URLSearchParams({
      userIp,
      email,
      fullName,
      countryCodeISO2,
      phoneCountryCode,
      phoneAreaCode,
      phoneNumber,
      emailOpt,
      language,
      affTrack,
      affToken,
      affTags,
    });

    const fetch = await import('node-fetch');
    const apiResponse = await fetch.default(XTRADE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody,
    });

    const responseData = await apiResponse.json();

    // Handle response
    if (responseData.success) {
      // Prepare new lead data
      const newLead = {
        AccountID: responseData.accountId,
        userIp: userIp,
        Email: email,
        FullName: fullName,
        CountryCodeISO2: countryCodeISO2,
        PhoneCountryCode: phoneCountryCode,
        PhoneAreaCode: phoneAreaCode,
        PhoneNumber: phoneNumber,
        Language: language,
        BotName: affTags,
        Date: new Date().toISOString(),
      };

      // Log the new lead data
      console.log('New Lead Data:', newLead);

      // Add the lead to the Excel file
      try {
        const workbook = XLSX.readFile(LEADS_FILE);
        const worksheet = workbook.Sheets['Leads'];

        if (!worksheet) {
          return res.status(500).json({ success: false, error: 'Leads sheet not found in the Excel file' });
        }

        const leads = XLSX.utils.sheet_to_json(worksheet);

        // Log existing leads before adding the new one
        console.log('Existing Leads:', leads);

        // Check if the leads array is being properly populated
        if (Array.isArray(leads)) {
          console.log('Leads is an array');
        } else {
          console.log('Leads is NOT an array');
        }

        // Push the new lead into the leads array
        leads.push(newLead); // This will add the new lead to the array

        // Log the updated leads array
        console.log('Updated Leads:', leads);

        // Convert the updated leads array to a worksheet
        const updatedWorksheet = XLSX.utils.json_to_sheet(leads);

        // Update the worksheet in the workbook
        workbook.Sheets['Leads'] = updatedWorksheet;

        // Write the updated workbook back to the Excel file
        XLSX.writeFile(workbook, LEADS_FILE);

        // Log the successful update
        console.log('Excel file has been updated successfully with the new lead.');

      } catch (error) {
        console.error('Error updating Excel file:', error);
        return res.status(500).json({ success: false, error: 'Failed to save lead to Excel file' });
      }

      // Respond with success
      res.json({ success: true, message: 'Lead submitted and saved to Excel file!', accountId: responseData.accountId });

    } else {
      // Handle error for duplicate emails
      if (responseData.errors && responseData.errors[0] === 'Email already exists') {
        console.log('Error: Email already exists');
      }

      // Even if there is an error, still update the Excel file with the lead
      const newLead = {
        AccountID: 'N/A',  // No account ID since the lead was rejected
         userIp: userIp,
        Email: email,
        FullName: fullName,
        CountryCodeISO2: countryCodeISO2,
        PhoneCountryCode: phoneCountryCode,
        PhoneAreaCode: phoneAreaCode,
        PhoneNumber: phoneNumber,
        Language: language,
        BotName: affTags,
        Date: new Date().toISOString(),
        Error: responseData.errors[0],  // Store error message
      };

      try {
        const workbook = XLSX.readFile(LEADS_FILE);
        const worksheet = workbook.Sheets['Leads'];

        if (!worksheet) {
          return res.status(500).json({ success: false, error: 'Leads sheet not found in the Excel file' });
        }

        const leads = XLSX.utils.sheet_to_json(worksheet);
        leads.push(newLead); // Add the rejected lead

        const updatedWorksheet = XLSX.utils.json_to_sheet(leads);
        workbook.Sheets['Leads'] = updatedWorksheet;
        XLSX.writeFile(workbook, LEADS_FILE);

        console.log('Excel file has been updated with the rejected lead.');

      } catch (error) {
        console.error('Error updating Excel file:', error);
      }

      res.status(400).json({ success: false, error: 'Lead submission failed: ' + responseData.errors[0] });
    }
  } catch (error) {
    console.error('Error connecting to the Xtrade API:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});