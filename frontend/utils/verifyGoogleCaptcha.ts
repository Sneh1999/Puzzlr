import axios from "axios";

export async function verifyGoogleCaptcha(token: string): Promise<boolean> {
  try {
    const params = new URLSearchParams();
    params.append("secret", process.env.RECAPTCHA_SECRET_KEY);
    params.append("response", token);

    const response = await axios.post(process.env.RECAPTCHA_URL, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data.success;
  } catch (error) {
    console.error(error);
    throw new Error(`Error verifying Google Captcha - ${error.message}`);
  }
}
