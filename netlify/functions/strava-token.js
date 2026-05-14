exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { code } = JSON.parse(event.body);

    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Authorization code is required' }),
      };
    }

    // These environment variables must be set in the Netlify dashboard
    const clientID = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (!clientID || !clientSecret) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Strava credentials not configured on server' }),
      };
    }

    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientID,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
        return {
            statusCode: response.status,
            body: JSON.stringify({ error: 'Strava API error', details: data })
        };
    }

    // Return the tokens and athlete info to the app
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        athlete_display_name: `${data.athlete.firstname} ${data.athlete.lastname}`.trim(),
      }),
    };
  } catch (error) {
    console.error('Strava token exchange error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to exchange token with Strava',
        details: error.message,
      }),
    };
  }
};
