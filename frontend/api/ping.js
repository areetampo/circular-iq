export default async function handler(req, res) {
  try {
    const baseUrl = process.env.VITE_API_URL;

    if (!baseUrl) {
      return res.status(500).json({ error: 'VITE_API_URL not set' });
    }

    await fetch(`${baseUrl}/health`);

    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    return res.status(500).json({ status: 'error' });
  }
}
