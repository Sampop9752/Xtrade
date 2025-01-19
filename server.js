import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const XTRADE_API_URL = 'https://www.xtrade.com/api/lead/create';

app.post('/api/lead/create', async (req, res) => {
  try {
    const {
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
      affTags
    } = req.body;

    if (!email || !fullName || !countryCodeISO2 || !phoneCountryCode || !phoneNumber || !language || !affTrack || !affToken) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const requestBody = new URLSearchParams({
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
      affTags
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

    if (responseData.success) {
      res.json(responseData);
    } else {
      res.status(400).json(responseData);
    }
  } catch (error) {
    console.error('Error connecting to the Xtrade API:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});